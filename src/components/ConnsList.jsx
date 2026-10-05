import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import isExpired from "./isExpired.jsx";

const getTrainPrefix = (name) => {
    if (!name) return "";
    const match = name.match(/^[^\s\d]+/);
    return match ? match[0] : name;
};
const formatTime = (t) => (t ? String(t).substring(0, 5) : "");
const normalizePrice = (data) => {
    if (data == null) return null;
    if (typeof data === "number") return data;
    if (typeof data === "object") {
        if (data.price != null) return Number(data.price);
        if (data.amount != null) return Number(data.amount);
        if (data.value != null) return Number(data.value);
    }
    const n = Number(data);
    return !isNaN(n) ? n : null;
};

async function fetchDistanceForRide(ride, signal) {
    const from = ride?.stopFrom?.station.name || "";
    const to = ride?.stopTo?.station.name || "";
    const trainName = ride?.train?.name || "";
    const pathUrl = `http://localhost:8080/api/distances/distance-train/${encodeURIComponent(from)}/${encodeURIComponent(to)}/${encodeURIComponent(trainName)}`;
    try {
        const res = await fetch(pathUrl, { method: "GET", signal });
        if (res.ok) {
            const data = await res.json();
            return data.distance;
        }
    } catch (err) {
        if (err.name === "AbortError") throw err;
        console.warn("fetch distance failed:", err);
    }
    return null;
}
const filterConns = (conns) => {
    if (!Array.isArray(conns)) return [];

    const map = new Map();

    conns.forEach((connection) => {
        const rides = Array.isArray(connection) ? connection : [connection];

        const first = rides[0];
        const last = rides[rides.length - 1];

        const arrival = last?.arrival;
        const departure = first?.departure;

        if (!arrival || !departure) return;

        const key = arrival;

        if (!map.has(key)) {
            map.set(key, connection);
        } else {
            const existing = map.get(key);
            const existingRides = Array.isArray(existing) ? existing : [existing];
            const existingDeparture = existingRides[0]?.departure;

            if (existingDeparture < departure) {
                map.set(key, connection);
            }
        }
    });

    return Array.from(map.values());
};

async function fetchPriceForRide(ride, distance, signal) {
    const trainName = ride?.train?.name || "";
    const pathUrl = `http://localhost:8080/api/price/${encodeURIComponent(distance)}/${encodeURIComponent(trainName)}/0`;
    try {
        let res = await fetch(pathUrl, { method: "GET", signal });
        if (res.ok) {
            const data = await res.json();
            const p = normalizePrice(data);
            if (p != null) return p;
        }
    } catch (err) {
        if (err.name === "AbortError") throw err;
        console.warn("fetch price failed:", pathUrl, err);
    }
    return null;
}

async function fetchDistanceAndPrice(ride, signal) {
    const distance = await fetchDistanceForRide(ride, signal);
    if (distance == null) return { distance: null, price: null };
    const price = await fetchPriceForRide(ride, distance, signal);
    return { distance, price };
}

function ConnsList({ conns,loading }) {
    const [pricesByConnIdx, setPricesByConnIdx] = useState({});
    const [visibleCount, setVisibleCount] = useState(3);
    const runIdRef = useRef(0);
    const abortRef = useRef(null);
    const navigate = useNavigate();
    const [loadin, setLoadin] = useState(false);
    const token=localStorage.getItem("token");
    const filteredConns=filterConns(conns);
    if(conns.length!==0) ;//setLoading(false);
    console.log("token "+token);
    useEffect(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }

        if (!Array.isArray(conns) || conns.length === 0) {
            setPricesByConnIdx({});
            return;
        }
        if(loading &&(!conns || conns.length === 0)) setLoadin(true);
        else setLoadin(false);
        const thisRun = ++runIdRef.current;
        const controller = new AbortController();
        abortRef.current = controller;

        const visibleConns = filteredConns.slice(0, visibleCount);

        setPricesByConnIdx((prev) => {
            let needInit = false;
            visibleConns.forEach((connection, idx) => {
                if (!prev[idx]) needInit = true;
            });
            if (!needInit) return prev;

            const next = { ...prev };
            visibleConns.forEach((connection, idx) => {
                if (!next[idx]) {
                    const rides = Array.isArray(connection) ? connection : [connection];
                    next[idx] = {
                        total: null,
                        segments: Array(rides.length).fill(null),
                        distances: Array(rides.length).fill(null),
                        loading: true,
                        error: null,
                    };
                }
            });
            return next;
        });

        (async () => {
            try {
                const perConn = await Promise.all(
                    visibleConns.map(async (connection, idx) => {
                        const rides = Array.isArray(connection) ? connection : [connection];

                        const promises = rides.map((ride) =>
                            fetchDistanceAndPrice(ride, controller.signal).catch((err) => {
                                if (err.name === "AbortError") throw err;
                                console.error("segment price fetch error:", err);
                                return { distance: null, price: null };
                            })
                        );

                        const results = await Promise.all(promises);

                        const segmentPrices = results.map((r) => r?.price ?? null);
                        const segmentDistances = results.map((r) => r?.distance ?? null);
                        const total = segmentPrices.reduce((acc, p) => acc + (typeof p === "number" ? p : 0), 0);
                        return { idx, segmentPrices, segmentDistances, total };
                    })
                );

                if (thisRun !== runIdRef.current) return;

                setPricesByConnIdx((prev) => {
                    const next = { ...prev };
                    perConn.forEach((r) => {
                        const existing = next[r.idx] || { segments: [], distances: [] };
                        next[r.idx] = {
                            ...existing,
                            train:r.train,
                            total: r.total,
                            segments: r.segmentPrices,
                            distances: r.segmentDistances,
                            loading: false,
                            error: null,
                        };
                    });
                    return next;
                });
            } catch (err) {
                if (err.name === "AbortError") return;
                console.error("Error calculating prices:", err);
            } finally {
                if (abortRef.current === controller) abortRef.current = null;
            }
        })();

        return () => controller.abort();
    }, [conns, visibleCount,loadin]);

    const handleChooseConnDetails = (connection, distances, price) => {
        if (!distances) {
            console.warn("attempt to navigate without distances");
            return;
        }
        const rides = Array.isArray(connection) ? connection : [connection];
        const connWithDists = rides.map((ride, i) => ({
            ...ride,
            distance: distances[i] ?? null,
        }));
        console.log("navigate payload >>>", { connWithDists, price });
        console.log("location before navigate:", window.location.pathname);
        navigate("choose-conn-details", { state: { connection: connWithDists, price } });
    };

    const stableKeyForConnection = (connection, idx) => {
        const rides = Array.isArray(connection) ? connection : [connection];
        const ids = rides.map((r, i) => r?.id ?? r?.travelStageId ?? `${r?.train?.id ?? "t"}-${i}`);
        return ids.join("_") || `conn-${idx}`;
    };

    return (
        <div style={{ marginTop: "70px", textAlign: "left" }}>
            <h3>Połączenia</h3>

            <ul className="list-group" style={{ paddingLeft: 0, listStyle: "none" }}>
                {((!conns || conns.length === 0) && !loading )&& <li>Brak połączeń</li>}
                {loadin && <li>Ładowanie...</li>}
                {filteredConns.slice(0, visibleCount).map((connection, idx) => {
                    const rides = Array.isArray(connection) ? connection : [connection];
                    const priceEntry = pricesByConnIdx[idx];

                    return (
                        <li key={stableKeyForConnection(connection, idx)} className="list-group-item" style={{ marginBottom: 16, padding: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                {rides.map((ride, i) => (
                                    <span key={i}>
                    {getTrainPrefix(ride?.train?.name) || "—"}
                                        {i < rides.length - 1 && " → "}
                  </span>
                                ))}
                            </div>

                            <div>
                                {rides[0]?.stopFrom?.station.name || "?"} ({formatTime(rides[0]?.departure)}) →{" "}
                                {rides[rides.length - 1]?.stopTo?.station.name || "?"} ({formatTime(rides[rides.length - 1]?.arrival)})
                            </div>

                            <div style={{ marginTop: 8 }}>
                                {priceEntry ? (
                                    priceEntry.loading ? (
                                        <span>Obliczanie ceny…</span>
                                    ) : priceEntry.error ? (
                                        <span style={{ color: "red" }}>{priceEntry.error}</span>
                                    ) : (
                                        <div>
                                            <div style={{ fontWeight: 700 }}>
                                                Cena: {priceEntry.total != null ? priceEntry.total.toFixed(2) + " zł" : "—"}
                                            </div>
                                            <div style={{ marginTop: 6 }}>
                                                {rides.map((ride, i) => (
                                                    <div key={i} style={{ fontSize: 13 }}>
                                                        {ride?.train?.name}: {ride.stopFrom?.station.name} → {ride.stopTo?.station.name} —{" "}
                                                        {priceEntry.segments?.[i] != null ? `${priceEntry.segments[i].toFixed(2)} zł` : "—"}
                                                        {priceEntry.distances?.[i] != null ? `  (${priceEntry.distances[i]} km)` : ""}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <span>Obliczanie ceny…</span>
                                )}
                                <button
                                    onClick={() => {
                                        console.log("PE:", pricesByConnIdx[idx]);
                                        handleChooseConnDetails(connection, priceEntry?.distances, priceEntry?.total);
                                    }}
                                    disabled={!priceEntry || priceEntry.loading || !priceEntry.distances|| isExpired(token)}
                                    style={{ marginTop: 8 }}
                                >
                                    Kup bilet
                                    </button>

                                    {isExpired(token)&&(
                                        <div style={{ color: "palevioletred" }}>
                                        {"Zalogowanie się jest wymagane do zakupu biletu."}
                                        </div>
                                    )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {visibleCount < (conns || []).length && (
                <button onClick={() => setVisibleCount((prev) => prev + 3)} style={{ marginTop: 10, padding: "8px 16px", borderRadius: 6 }}>
                    Więcej
                </button>
            )}
        </div>
    );
}

export default ConnsList;
