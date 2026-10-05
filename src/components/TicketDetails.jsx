import React, { useEffect, useState } from "react";
import {useParams, Link, useNavigate} from "react-router-dom";
import ReturnTicket from "./ReturnTicket";
import QRCode from "react-qr-code"
function TicketDetails() {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");
    const [stops,setStops] = useState([]);
    const [stopsMap,setStopsMap] = useState(new Map());
    const navigate = useNavigate();
    useEffect(() => {
        const fetchTicketData = async () => {
            try {
                const resTicket = await fetch(`http://localhost:8080/api/tickets/${id}`, {
                    headers: { "Content-Type":"application/json",Authorization: `Bearer ${token}` },
                });
                if (!resTicket.ok) throw new Error("Błąd pobierania biletu");
                const ticketData = await resTicket.json();
                setTicket(ticketData);

                const resConnections = await fetch(`http://localhost:8080/api/travel-stages/ticket/${id}`, {
                    headers: { "Content-Type":"application/json",Authorization: `Bearer ${token}` },
                });
                if (!resConnections.ok) throw new Error("Błąd pobierania etapów podróży");
                const connectionsData = await resConnections.json();
                setConnections(connectionsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTicketData();
    }, [id, token]);
    
    if (loading) return <p>Ładowanie...</p>;
    if (!ticket) return <p>Nie znaleziono biletu.</p>;
    const fetchStops = async (stopFromId,stopToId,trainId,connId) => {
        try {
            const resStops = await fetch(`http://localhost:8080/api/stops/${stopFromId}/${stopToId}/${trainId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!resStops.ok) throw new Error("Błąd pobierania stopów");
            const stopsJson = await resStops.json();
            setStops(stopsJson);
            setStopsMap(prev => ({
                ...prev,
                [connId]: stopsJson
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link to="/tickets" className="text-blue-600 hover:underline">
                ← Powrót do listy
            </Link>

            <div className="p-6 rounded-xl shadow" style={{border:"0.1px solid aliceblue"}}>
                <h2 className="text-xl font-semibold mb-2">
                    Bilet{ticket.status==="returned" && (
                    <p>{" (zwrócony)"}</p>
                )}
                </h2>
                <QRCode value={JSON.stringify(connections)}/>
                <p>
                    <strong>Cena:</strong> {ticket.price.toFixed(2)} zł
                </p>
                {ticket.discount&&(
                <p>
                    <strong>Ulga:</strong>{" "}
                    {`${ticket.discount.name} ${(ticket.discount.value*100)}%`}
                </p>
                    )}
                <p>
                    <strong>Dodatkowe informacje:</strong>{" "}
                    {ticket.hasDog && "przewóz psa"}
                    {ticket.hasBike && "przewóz roweru"}
                    {ticket.hasLuggage && "dodatkowy bagaż"}
                    {!ticket.hasDog && !ticket.hasBike && !ticket.hasLuggage && "Brak"}
                </p>
            </div>

            <div className="p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-3">Etapy podróży</h3>
                {connections.length === 0 ? (
                    <p>Brak etapów podróży.</p>
                ) : (
                    <ul className="space-y-2">
                        {connections.map((c) => (
                            <li
                                key={c.id}
                                className="pb-2 flex justify-between" style={{border:"0.1px solid aliceblue"}}
                            >
                                <div>
                                    <p className="font-medium">
                                        {c.stopFrom.station.name} ({c.stopFrom.departureTime.substring(0,5)}) -
                                        peron {c.stopFrom.platform},
                                        tor {c.stopFrom.track} → {c.stopTo.station.name} ({c.stopTo.arrivalTime.substring(0,5)}) -
                                        peron {c.stopTo.platform}, tor {c.stopTo.track}
                                    </p>
                                    {c.seatTrainDate!==null && (
                                        <div className="flex justify-end">
                                           <p>
                                               Wagon: {c.seatTrainDate.seat.trainCar.carNumber}
                                           </p>
                                        <p>
                                               Miejsce: {c.seatTrainDate.seat.number}
                                    </p>
                                <p>
                                    Klasa: {c.seatTrainDate.seat.classField}</p>
                                <p>
                                               {c.seatTrainDate.seat.isCompartment ? "Wagon z przedziałami":"Wagon bez przedziałów" }
                            </p>
                                        </div>

                                        )
                                    }
                                    <p className="text-sm text-gray-500">
                                        {c.trainDate.train.name} {c.trainDate.date} {/*– {c.distance} km*/}
                                    </p>
                                </div>
                                {!stopsMap[c.id] && (<button type="button" onClick={()=>{fetchStops(c.stopFrom.id,c.stopTo.id,c.trainDate.train.id,c.id)}}>Pobierz listę postojów pośrednich</button>)}

                                    <ul className="space-y-2">
                                        <li className="border-b border-gray-200 pb-2 flex justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {c.stopFrom.station.name} {c.stopFrom.arrivalTime ? c.stopFrom.arrivalTime.substring(0,5):``} {c.stopFrom.departureTime ? c.stopFrom.departureTime.substring(0,5):``} - peron {c.stopFrom.platform} - tor {c.stopFrom.track}
                                                </p>
                                            </div>
                                        </li>
                                        {/*stopsMap[c.id]?.length!==0 && (*/}
                                        {stopsMap[c.id]?.map((stop) => (
                                                <li
                                                    key={stop.id}
                                                    className="border-b border-gray-200 pb-2 flex justify-between"
                                                >
                                                    <div>
                                                        <p className="font-medium">
                                                            {stop.station.name} {stop.arrivalTime ? stop.arrivalTime.substring(0,5):``} {stop.departureTime ? stop.departureTime.substring(0,5):``} - peron {stop.platform} - tor {stop.track}
                                                        </p>
                                                    </div>
                                                </li>
                                                    )

                                            )
                                        }
                                        <li className="border-b border-gray-200 pb-2 flex justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {c.stopTo.station.name} {c.stopTo.arrivalTime ? c.stopTo.arrivalTime.substring(0,5):``} {c.stopTo.departureTime ? c.stopTo.departureTime.substring(0,5):``} - peron {c.stopTo.platform} - tor  {c.stopTo.track}
                                                </p>
                                            </div>
                                        </li>
                                        </ul>


                                <p className="mt-4 text-sm text-gray-700">
                                    <strong>Dystans:</strong> {c.distance} km
                                </p>
                            </li>
                        ))}
                    </ul>

                )}

            </div>

            {ticket.status!=="returned"&&(

                <ReturnTicket orderId={ticket.extId}/>
                )}

            {ticket.status==="returned"&&(
                <button onClick={()=>{
                    console.log("c[0] "+connections[0].stopFrom.station.name);
                    console.log("c[0] "+connections[connections.length-1].stopTo.station.name);
                    navigate(`/?from=${connections[0].stopFrom.station.name}&to=${connections[connections.length-1].stopTo.station.name }`)

                }}>Wyszukaj połączenie</button>
            )}

        </div>
    );
}
export default TicketDetails;