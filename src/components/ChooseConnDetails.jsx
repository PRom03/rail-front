import React, {useEffect, useState} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentBox from "./PaymentBox.jsx";
import SearchForm from "./SearchForm.jsx";
import SeatReservation from "./SeatReservation.jsx";
import { v4 as uuidv4 } from "uuid";
function ChooseConnDetails() {
    const [loading, setLoading] = useState(false);
    {// const [message, setMessage] = useState("");
         }
    const {state} = useLocation();
    const navigate = useNavigate();
    const [hasSeats, setHasSeats] = useState(false)
    const connection = state?.connection;
    const price = state?.price;
    const [wagonClass, setWagonClass] = useState("2");
    const [discounts, setDiscounts] = useState([]);
    const [selectedDiscount, setSelectedDiscount] = useState(0);
    const [loadingDiscounts, setLoadingDiscounts] = useState(false);
    const [error, setError] = useState(null);
    const [hasLuggage, setHasLuggage] = useState(false);
    const [hasDog, setHasDog] = useState(false);
    const [hasBike, setHasBike] = useState(false);
    const [selectedSeats, setSelectedSeats] = useState({});
    const [connectionWithKeys, setConnectionWithKeys] = useState([]);
    const additionalPriceAdjustment=(price_)=>{
        let aux=price_;
        if(hasLuggage) aux+=5;
        if(hasDog) aux+=5;
        if(hasBike) aux+=5;
        return aux;
    }
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
    const fetch1stClassPrice=async(dist,train)=>{
        const trainName = train?.name || "";
        const pathUrl = `http://localhost:8080/api/price/${encodeURIComponent(dist)}/${encodeURIComponent(trainName)}/1`;
        try {
            let res = await fetch(pathUrl, { method: "GET",
            });
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
    useEffect(() => {
        if (!connection) navigate("/");
    }, [connection, navigate]);
    if (!connection) {
        return (
            <div style={{padding: 20}}>
                <p>Nie przekazano danych o połączeniu.</p>
                <button onClick={() => navigate(-1)}>Wróć</button>
            </div>
        );
    }


    const first = connection[0];
    const last = connection[connection.length - 1];
    const totalBase = price;
    Date.prototype.addDays = function(days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }

    let d = new Date().addDays();
    let date=d.toISOString().split("T")[0];
    const trainIds = connection.map(seg => seg.train.id);
    const [trainDateIds,setTrainDateIds] = useState([]);
    const totalBaseCents = Math.round(totalBase * 100);

    const totalClassAdjustedCents = wagonClass === "1"
        ? Math.round(totalBaseCents * 3 / 2)
        : totalBaseCents;

    const totalDiscountAdjustedCents = selectedDiscount
        ? Math.round(totalClassAdjustedCents * (1 - selectedDiscount.value))
        : totalClassAdjustedCents;

    const luggageCents = hasLuggage ? 500 : 0;
    const dogCents = hasDog ? 500 : 0;
    const bikeCents = hasBike ? 500 : 0;

    const totalAdjustedCents = totalDiscountAdjustedCents + luggageCents + dogCents + bikeCents;

    const totalAdjusted = Number((totalAdjustedCents / 100).toFixed(2));
    useEffect(() => {
        if (!connection) return;

        setConnectionWithKeys(
            connection.map(seg => ({
                ...seg,
                stageKey: uuidv4()
            }))
        );
    }, [connection]);



    const resolveTrainDate = async (trainId) => {
        setLoading(true);

        try {
            const res = await fetch(`http://localhost:8080/api/train-date/${trainId}/${date}`);
            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
           return data.trainDateId;
        } catch (err) {
            console.log(err);
        }

        setLoading(false);
    };
    const check = async (trainDateId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/train-seats/${trainDateId}`);
            if (!res.ok) throw new Error("Error fetching seats");

            const data = await res.json();
            setHasSeats(data.hasSeats);
            return data.hasSeats;
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!trainIds || trainIds.length === 0) return;
        if(trainDateIds.length!==0) return;
        (async () => {
            const results = await Promise.all(
                trainIds.map(id => resolveTrainDate(id))
            );

            const parsed = await Promise.all(results);


            setTrainDateIds(parsed);
        })();
    }, [trainIds, date]);
    {/*useEffect(() => {
        if (!trainDateIds || trainDateIds.length === 0) return;

        trainDateIds.forEach(id => check(id));

    }, [trainDateIds.join(",")]);*/}
    const trainDateIdMap = {};
    connection.forEach((seg, i) => {
        if (trainDateIds[i]) trainDateIdMap[seg.id] = trainDateIds[i];
    });
    useEffect(()=>{
        const handleFetchDiscounts = async () => {
            try {
                setLoadingDiscounts(true);
                setError(null);
                const response = await fetch("http://localhost:8080/api/discounts/");
                if (!response.ok) throw new Error("Błąd pobierania listy ulg");
                const data = await response.json();
                setDiscounts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoadingDiscounts(false);
            }
        };
        handleFetchDiscounts();
        console.log(discounts)
        }

    ,[]);
    const updateSeat = (stageKey, seat) => {
        setSelectedSeats(prev => ({
            ...prev,
            [stageKey]: seat
        }));
    };
    const [availability, setAvailability] = useState({});

    useEffect(() => {
        async function load() {
            const result = {};
            for (let i = 0; i < trainDateIds.length; i++) {
                result[trainDateIds[i]] = await check(trainDateIds[i]);
            }
            setAvailability(result);
        }
        load();
    }, [trainDateIds]);
    useEffect(() => {

    }, [selectedDiscount]);
    return (
        <div style={{padding: 20}}>
            <h2>Kup bilet</h2>

            <p>
                <strong>Trasa:</strong> {first.stopFrom.station.name} → {last.stopTo.station.name}
            </p>

            <h4>Klasa wagonu</h4>
            <label style={{marginRight: 12}}>
                <input
                    type="checkbox"
                    checked={wagonClass === "1"}
                    onChange={() =>
                        setWagonClass((prev) => (prev === "1" ? "2" : "1"))
                    }
                />{" "}
                1 klasa
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={wagonClass === "2"}
                    onChange={() =>
                        setWagonClass((prev) => (prev === "2" ? "1" : "2"))
                    }
                />{" "}
                2 klasa
            </label>
            <h4>Opcje dodatkowe:</h4>
            <label style={{marginRight: 12}}>
                <input
                    type="checkbox"
                    checked={hasLuggage}
                    onChange={e =>
                        setHasLuggage(e.target.checked)
                    }
                />{" "}
                Dodatkowy bagaż
            </label>
            <label style={{marginRight: 12}}>
                <input
                    type="checkbox"
                    checked={hasDog}
                    onChange={e =>
                        setHasDog(e.target.checked)
                    }
                />{" "}
                Przewóz psa
            </label>
            <label style={{marginRight: 12}}>
                <input
                    type="checkbox"
                    checked={hasBike}
                    onChange={e =>
                        setHasBike(e.target.checked)
                    }
                />{" "}
                Przewóz roweru
            </label>
            <div style={{marginTop: 20}}>


                {error && <p style={{color: "red"}}>{error}</p>}

                {discounts.length > 0 && (
                    <div style={{marginTop: 10}}>
                        <strong>Wybierz ulgę:</strong>

                        <select
                            value={selectedDiscount ? selectedDiscount.name : "Brak"}
                            onChange={(e) => {
                                const found = discounts.find(d => d.name === e.target.value);
                                setSelectedDiscount(found || {name: "Brak", value: 0});
                            }}
                        >
                            <option value="">Brak</option>

                            {discounts.map((d) => (
                                <option key={d.name} value={d.name}>
                                    {d.name} ({d.value * 100}%)
                                </option>
                            ))}


                        </select>
                    </div>
                )}
            </div>
            {/*hasSeats && (
                <SeatReservation selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat}/>
            )*/}
            {connectionWithKeys.map( seg => {
                const trainDateId = trainDateIdMap[seg.id];
                if (!trainDateId || availability[trainDateId] !== true) return null;
                    return (
                        <SeatReservation
                            key={seg.stageKey}
                            segment={seg}
                            selectedSeat={selectedSeats[seg.stageKey]}
                            onCheckAvailability={() => check(trainDateIdMap[seg.id])}
                            onSelectSeat={seat => updateSeat(seg.stageKey, seat)}
                            train_id={seg.train.id}
                            train_date_id={trainDateIdMap[seg.id]}

                        />
                    )
                }
            )}

            <div style={{marginTop: 20, fontWeight: "bold"}}>
                Cena: {totalAdjusted.toFixed(2)} zł
            </div>
            {selectedDiscount!==null && <PaymentBox  amount={totalAdjusted.toFixed(2)} discount={selectedDiscount}
                        connection={connectionWithKeys} seats={selectedSeats} trainDateIds={trainDateIds}
                hasLuggage={hasLuggage}
                hasDog={hasDog}
                hasBike={hasBike}>
            </PaymentBox>
            }

        </div>
    );
}

export default ChooseConnDetails;
