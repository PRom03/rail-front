import {useEffect, useState} from "react";
import SearchForm from "./SearchForm";
import ConnsList from "./ConnsList";
import TransporterFilters from "./TransporterFilters.jsx";

function ConnSearch() {
    const [conns, setConns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fromStation, setFromStation] = useState("");
    const [toStation, setToStation] = useState("");
    const params = new URLSearchParams(location.search);

        useEffect(() => {
            setFromStation(params.get("from"));
            setToStation(params.get("to"));
    }, []);
    const fetchConns = async ({ from, to, time, transporters}) => {
        try {
            const res = await fetch(
                `http://localhost:8080/api/search/${from}/${to}/${time}`,{
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(transporters)
                }
            );
            setLoading(true);
            const data = await res.json();
            setConns(data);
            setLoading(false);
        } catch (err) {
            console.error("Błąd podczas pobierania połączeń:", err);
        }
    };

    return (
        <div>
            <SearchForm onSearch={fetchConns} from_={fromStation} to_={toStation} />

            <ConnsList conns={conns} loading={loading} />
        </div>
    );
}
export default ConnSearch;