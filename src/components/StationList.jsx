import React, { useEffect, useState } from "react";

export default function StationList() {
    const [stations, setStations] = useState([]);
    const [newStationName, setNewStationName] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editedName, setEditedName] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadStations();
    }, []);
    const retrieveStations = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/retrieve/stations",{
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,

                }}
            );
            if (!res.ok) throw new Error(await res.text());
        } catch {
            setError("Nie udało się pobrać stacji");
        }
    };
    const loadStations = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/stations/",{
                headers:{
                "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,

                }}
            );
            const data = await res.json();
            setStations(Array.isArray(data) ? data : data.content ?? []);
        } catch {
            setError("Nie udało się pobrać stacji");
        }
    };

    const handleAddStation = async (e) => {
        e.preventDefault();
        if (!newStationName.trim()) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("http://localhost:8080/api/stations/add", {
                method: "POST",
                headers: { "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ name: newStationName.trim() })
            });

            if (!res.ok) throw new Error(await res.text());

            setNewStationName("");
            await loadStations();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };
    const startEdit = (station) => {
        setEditingId(station.id);
        setEditedName(station.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditedName("");
    };

    const saveEdit = async (id) => {
        if (!editedName.trim()) return;

        await fetch(`http://localhost:8080/api/stations/${id}/update`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ name: editedName.trim() })
        });

        setStations(stations.map(s =>
            s.id === id ? { ...s, name: editedName } : s
        ));

        cancelEdit();
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Usunąć tę stację?")) return;

        try {
            const res = await fetch(`http://localhost:8080/api/stations/${id}/delete`, { method: "DELETE" ,

                headers:{
                    "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,

                }});
            if (!res.ok) throw new Error("Błąd usuwania stacji");
            setStations(stations.filter(s => s.id !== id));
        } catch {
            alert("Nie udało się usunąć stacji");
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: "auto" }}>
            <br/>
            <h2>Stacje</h2>
            <button onClick={() => retrieveStations()}>
                Pobierz stacje
            </button>
            <form onSubmit={handleAddStation} style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder="Nazwa stacji"
                    value={newStationName}
                    onChange={e => setNewStationName(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Dodawanie..." : "Dodaj stację"}
                </button>
            </form>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Lista */}
            <table width="100%" border="1" cellPadding="6">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Nazwa</th>
                    <th>Akcje</th>
                </tr>
                </thead>
                <tbody>
                {stations.length === 0 ? (
                    <tr>
                        <td colSpan="3">Brak stacji</td>
                    </tr>
                ) : (
                    stations.map(station => (
                            <tr key={station.id}>
                                <td>{station.id}</td>

                                <td>
                                    {editingId === station.id ? (
                                        <input
                                            value={editedName}
                                            onChange={e => setEditedName(e.target.value)}
                                        />
                                    ) : (
                                        station.name
                                    )}
                                </td>

                                <td>
                                    {editingId === station.id ? (
                                        <>
                                            <button onClick={() => saveEdit(station.id)}>
                                                Zapisz
                                            </button>
                                            <button onClick={cancelEdit}>
                                                Anuluj
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(station)}>
                                                Edytuj
                                            </button>
                                            <button
                                                onClick={() => handleDelete(station.id)}
                                                style={{ color: "red" }}
                                            >
                                                Usuń
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )))}
                </tbody>
            </table>
        </div>
    );
}
