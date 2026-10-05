import React, {useEffect, useState} from "react";

function AddTrainDates() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [trains, setTrains] = useState([]);

    useEffect(() => {
        loadTrains();
    }, []);

    const loadTrains = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/",{
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                }
            });
            const data = await res.json();
            setTrains(data);
        } catch {
            setError("Nie udało się pobrać pociągów");
        }
    };
    const getDatesInRange = (start, end) => {
        const dates = [];
        let current = new Date(start);
        const last = new Date(end);

        while (current <= last) {
            dates.push(current.toISOString().slice(0, 10));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    };

    const handleSubmit = async () => {
        setError(null);

        if (!from || !to) {
            setError("Podaj pełny zakres dat.");
            return;
        }

        const dates = getDatesInRange(from, to);

        const records = trains.flatMap(train =>
            dates.map(date => ({
                trainId: train.id,
                date: date
            }))
        );

        setLoading(true);

        try {
            const res = await fetch("http://localhost:8080/api/train-date/add-many", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(records)
            });

            if (!res.ok) {
                throw new Error("Błąd zapisu danych");
            }

            alert("Daty dodane poprawnie");
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div>
            <br/>
            <h3>Dodaj daty dla wszystkich pociągów</h3>

            <label>
                Od:
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </label>

            <label>
                Do:
                <input type="date" value={to} onChange={e => setTo(e.target.value)} />
            </label>

            <button onClick={handleSubmit} disabled={loading}>
                {loading ? "Dodawanie..." : "Dodaj"}
            </button>

            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}

export default AddTrainDates;
