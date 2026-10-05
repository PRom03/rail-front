import React, { useEffect, useState } from "react";

export default function TrainList() {
    const [trains, setTrains] = useState([]);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState([]);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    useEffect(() => {
        loadTrains();
    }, []);
    const toggleTrain = (id) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selected.length === trains.length) {
            setSelected([]);
        } else {
            setSelected(trains.map(t => t.id));
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

    const handleImport = async () => {
        if (!file) {
            alert("Wybierz plik");
            return;
        }
        const formData = new FormData();
        formData.append("file", file);
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:8080/api/import", {
                method: "POST",
                body: formData,
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });
            if (!res.ok) throw new Error(await res.text());
            alert("Import zakończony sukcesem");
            setFile(null);
            await loadTrains();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (trainId) => {
        if (!window.confirm("Usunąć ten pociąg?")) return;

        try {
            const res = await fetch(`http://localhost:8080/api/${trainId}/delete`, {
                method: "DELETE",
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }

            });

            if (!res.ok) {
                throw new Error("Błąd usuwania");
            }

            setTrains(trains.filter(t => t.id !== trainId));
        } catch {
            alert("Nie udało się usunąć pociągu");
        }
    };
    const handleSubmit = async () => {
        setError("");

        if (!from || !to) {
            setError("Podaj pełny zakres dat.");
            return;
        }

        if (selected.length === 0) {
            setError("Nie wybrano żadnych pociągów.");
            return;
        }

        const dates = getDatesInRange(from, to);

        const records = selected.flatMap(trainId =>
            dates.map(date => ({
                trainId,
                date
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
        <div style={{ maxWidth: 800, margin: "auto" }}>
            <br/>
            <h2>Pociągi</h2>

            <div style={{ marginBottom: 20 }}>
                <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={e => setFile(e.target.files[0])}
                />
                <button onClick={handleImport} disabled={loading}>
                    {loading ? "Importuję..." : "Importuj pociąg"}
                </button>
            </div>
            <div style={{ marginBottom: 20 }}>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                <input type="date" value={to} onChange={e => setTo(e.target.value)} />
                <button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Zapisuję..." : "Dodaj daty"}
                </button>
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}

            <table width="100%" border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>
                        <input
                            type="checkbox"
                            checked={selected.length === trains.length && trains.length > 0}
                            onChange={toggleAll}
                        />
                    </th>
                    <th>ID</th>
                    <th>Nazwa</th>
                    <th>Akcje</th>
                </tr>
                </thead>
                <tbody>
                {trains.length === 0 && (
                    <tr>
                        <td colSpan="4">Brak danych</td>
                    </tr>
                )}
                {trains.map(train => (
                    <tr key={train.id}>
                        <td>
                            <input
                                type="checkbox"
                                checked={selected.includes(train.id)}
                                onChange={() => toggleTrain(train.id)}
                            />
                        </td>
                        <td>{train.id}</td>
                        <td>{train.name}</td>
                        <td>
                            <button
                                onClick={() => handleDelete(train.id)}
                                style={{ color: "red" }}
                            >
                                Usuń
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
