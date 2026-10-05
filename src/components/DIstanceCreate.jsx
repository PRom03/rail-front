import {useEffect, useState} from "react";

const DistanceCreate = () => {
    const [station1Id, setStation1Id] = useState(0);
    const [station2Id, setStation2Id] = useState(0);
    const [distance, setDistance] = useState(0.000);
    const [stations,setStations] = useState([]);
useEffect(() => {
    const fetchStations = async () => {
        const res = await fetch("http://localhost:8080/api/stations/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        if (!res.ok) return await res.text();
        const data = await res.json();
        setStations(data);
    }
    fetchStations();

},[])
    const handleSubmit = async (e) => {
        e.preventDefault();
        let stationFromId = station1Id;
        let stationToId = station2Id;
        const res = await fetch("http://localhost:8080/api/distances/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({stationFromId, stationToId,distance})
        });
        if (!res.ok) return await res.text();
        await res.json();

        setStation1Id("");
        setStation2Id("");
        setDistance("");
    };

    return (
        <form onSubmit={handleSubmit}>
            <br/>
            <h3>Utwórz dystans</h3>

            <select
                value={station1Id}
                onChange={(e) => setStation1Id(e.target.value)}
                required
            >
                <option value="">Wybierz stację 1</option>
                {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.name}
                    </option>
                ))}
            </select>

            <select
                value={station2Id}
                onChange={(e) => setStation2Id(e.target.value)}
                required
            >
                <option value="">Wybierz stację 2</option>
                {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.name}
                    </option>
                ))}
            </select>

            <input
                type="number"
                step="0.01"
                placeholder="Distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                required
            />

            <button type="submit">Utwórz</button>
        </form>
    );
};

export default DistanceCreate;
