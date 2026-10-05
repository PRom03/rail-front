import {useState} from "react";

function StationInput({ label, value, onChange ,onSelected,onModified}) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    {/*const [selected, setSelected] = useState(false);
    const [modified, setModified] = useState(false);*/}
    const handleInput = async (e) => {
        const val = e.target.value;
        onChange(val);
        onModified(true);
        onSelected(false);
        setHighlightIndex(-1);
        if (val.length > 1) {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8080/api/stations/q/${encodeURIComponent(val)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                } else {
                    setSuggestions([]);
                }
            } catch (err) {
                console.error("Błąd pobierania stacji:", err);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        } else {
            setSuggestions([]);
        }
    };

    const handleSelect = (stationName) => {
        onChange(stationName);
        onSelected(true);
        onModified(false);
        console.log("select")
        setSuggestions([]);
        setHighlightIndex(-1);
    };
    const handleKeyDown = (e) => {
        if (suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
        }
        if (e.key === "Enter" && highlightIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[highlightIndex].name);
        }
        if (e.key === "Escape") {
            setSuggestions([]);
            setHighlightIndex(-1);
        }
    };
    return (
        <div style={{ marginBottom: "10px", position: "relative" }}>
            <label>
                {label}{" "}
                <input
                    type="text"
                    value={value}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />
            </label>
            {loading && <div>Ładowanie...</div>}
            {suggestions.length > 0 && (
                <ul
                    style={{
                        listStyle: "none",
                        margin: 0,
                        padding: "4px",
                        border: "1px solid #ccc",
                        position: "absolute",
                        background: "lightblue",
                        zIndex: 1000,
                        width: "100%",
                    }}
                >

                    {suggestions.map((s, i) => (
                        <li
                            key={s.id}
                            onClick={() => handleSelect(s.name)}
                            style={{
                                cursor: "pointer",
                                padding: "2px 4px",
                                background: i === highlightIndex ? "aliceblue" : "lightblue",
                                color:"darkblue",
                                border: "1px solid aliceblue",
                            }}
                        >
                            {s.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
export default StationInput;