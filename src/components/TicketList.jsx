import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function TicketList() {
    const [tickets, setTickets] = useState([]);
    const [travelStages,setTravelStages] = useState({});
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");
    const [travelStagesCount,setTravelStagesCount] = useState(0);
    useEffect(() => {
        setLoading(true);
        const fetchTickets = async () => {
            try {
                const res = await fetch("http://localhost:8080/api/tickets/my", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Błąd podczas pobierania biletów");

                const data = await res.json();
                setTickets(data || []);
            } catch (err) {
                console.error(err);
            }
        };

        fetchTickets();


    }, [token]);
useEffect(() => {
    if (!tickets||tickets.length === 0) return;
    console.log(tickets);
    const fetchTravelStages = async (ticketId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/travel-stages/ticket/${ticketId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Błąd podczas pobierania etapów podróży");

            const data = await res.json();
            console.log("Fetched for", ticketId, data);
            setTravelStages(prev => ({
                ...prev,
                [ticketId]: Array.isArray(data) ? [...data] : { ...data }
            }));
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };
    for (let i = 0; i < tickets.length; i++) {

        fetchTravelStages(tickets[i].id);

    }
},[tickets,token]);
    useEffect(() => {
        setTravelStagesCount(travelStages.length);
    }, [travelStages]);
    if (loading) return <p className="text-gray-500">Ładowanie biletów...</p>;

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Twoje bilety</h1>

            {tickets.length === 0 ? (
                <p>Nie znaleziono żadnych biletów.</p>
            ) : (
                <ul className="space-y-3">
                    {tickets.map((ticket) => (
                        <li
                            key={ticket.id}
                            className="rounded-xl shadow p-4 flex justify-between items-center hover:shadow-md transition"
                            style={{border:"0.1px solid aliceblue"}}
                        >
                            <div>
                                <p className="font-medium">Bilet</p>
                                <p >
                                    { travelStages[ticket.id]?.length>0 && travelStages[ticket.id][0].stopFrom.station.name}{" - "}{travelStages[ticket.id]?.length>0 && travelStages[ticket.id][travelStages[ticket.id].length-1].stopTo.station.name} – {travelStages[ticket.id]?.length>0 && travelStages[ticket.id][0].trainDate.date || "Data nieznana"}
                                </p>
                            </div>
                            <Link
                                to={`/tickets/${ticket.id}`}
                                className="text-blue-600 hover:underline"
                            >
                                Szczegóły →
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
export default TicketList;
