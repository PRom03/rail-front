import {useEffect, useMemo, useState} from "react";
import TransportersFilters from "./TransporterFilters.jsx";
import StationInput from "./StationInput.jsx";
function SearchForm({ onSearch }) {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [time, setTime] = useState(new Date());
    const [transporters, setTransporters] = useState([]);

    const [showFilters, setShowFilters] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [fromSelected, setFromSelected] = useState(false);
    const [toSelected, setToSelected] = useState(false);
    const [modified, setModified] = useState(false);
    const params = new URLSearchParams(location.search);
    const handleSubmit = (e) => {
        e.preventDefault();
        if(transporters.length===0) setTransporters(["IC","KM","IR","R","KM OsP"]);
        onSearch({ from, to, time,transporters});
    };
    useEffect(() => {
        setFrom(params.get("from"));
        setTo(params.get("to"));
    }, []);
    useEffect(() => {

            const fetchFavorites = async () => {
                const token = localStorage.getItem("token");
                if(!token) return;
                try {
                    const res = await fetch("http://localhost:8080/api/favorites/my",{
                        headers:{
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        }
                    });
                    if (!res.ok) throw new Error("Błąd pobierania ulubionych");
                    const data = await res.json();
                    setFavorites(data);
                } catch (e) {
                    console.error(e);
                }
            };

            fetchFavorites();
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        setTime(`${hh}:${mm}`);
    }, []);
    const favouriteEntry = useMemo(() => {
        if (!from || !to) return null;
        return favorites.find(
            f =>
                f.stationFrom.name.toLowerCase() === from.toLowerCase() &&
                f.stationTo.name.toLowerCase() === to.toLowerCase()
        );
    }, [favorites, from, to]);

    const isFavourite = Boolean(favouriteEntry);

    const addFavorite = async () => {
        if (!from || !to) return;
        try {
            const res = await fetch("http://localhost:8080/api/favorites/add", {
                method: "POST",
                headers: { "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`, },
                body: JSON.stringify({ stationFrom:from, stationTo:to })
            });

            if (!res.ok) throw new Error("Nie udało się dodać ulubionej relacji");
            const newFav = await res.json();
            setFavorites(prev => [...prev, newFav]);
        } catch (e) {
            console.error(e);
        }
    };

    const removeFavorite = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/favorites/${favouriteEntry.id}`, {
                method: "DELETE",
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                }
            });
            if (!res.ok) throw new Error("Usuwanie ulubionej relacji nie powiodło się");

            setFavorites(prev => prev.filter(f => f.id !== favouriteEntry.id));
        } catch (e) {
            console.error(e);
        }
    };

    const toggleFavorite = () => {
        if (isFavourite) removeFavorite();
        else addFavorite();
    };
    return (
        <form
            onSubmit={handleSubmit}
            style={{
                marginTop: "70px",
                textAlign: "left",
                marginBottom: "20px",
                border: "0.1px solid aliceblue",
            }}
        >
            <StationInput label="Stacja początkowa:" value={from} onChange={setFrom} onSelected={(val)=>setFromSelected(val)} onModified={(val)=>setModified(val)}/>
            <StationInput label="Stacja końcowa:" value={to} onChange={setTo} onSelected={(val)=>setToSelected(val)} onModified={(val)=>setModified(val)}/>
            {(from && to) && fromSelected && toSelected && !modified && (
                <span
                    onClick={toggleFavorite}
                    style={{
                        cursor: "pointer",
                        fontSize: 22,
                        color: isFavourite ? "gold" : "gray"
                    }}
                    title={isFavourite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                >
                        {isFavourite ? "★" : "☆"}
                    </span>
            )}

            <div style={{ marginBottom: "10px" }}>
                <label>
                    Godzina:{" "}
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                    />
                </label>


                <br />
            </div>
            {favorites.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <h3>Ulubione relacje</h3>

                    <ul>
                        {favorites.map(f => (
                            <li
                                key={f.id}
                                style={{ cursor: "pointer", marginBottom: 8 }}
                                onClick={() => {
                                    setFrom(f.stationFrom.name);
                                    setTo(f.stationTo.name);
                                    setFromSelected(true);
                                    setToSelected(true);
                                    setModified(false);
                                }}
                            >
                                {f.stationFrom.name} → {f.stationTo.name}
                                {/*<span
                                    onClick={removeFavorite}
                                    style={{
                                        cursor: "pointer",
                                        fontSize: 22,
                                        color: "gold"
                                    }}
                                    title="Usuń z ulubionych"
                                >
                        ★
                    </span>*/}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <button
                type="button"
                onClick={() => setShowFilters(true)}
                style={{ marginTop: 10 }}
            >
                Filtry
            </button>

            {showFilters && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                    }}

                >
                    <TransportersFilters
                        selected={transporters}
                        onChange={setTransporters}
                        onClose={() => setShowFilters(false)}
                    />

                </div>
            )}
            <button type="submit">Szukaj</button>
        </form>
    );
}
export default SearchForm;