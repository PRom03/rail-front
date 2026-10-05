import React, {useEffect, useState} from "react";

function TransportersFilters({ selected,onChange,onClose }) {
	const transporters=["IC","KM","IR","R","KM OsP"];
    const [localSelected, setLocalSelected] = useState(transporters);

    useEffect(() => {
        if (Array.isArray(selected) && selected.length > 0) {
            setLocalSelected(selected);
        } else {
            setLocalSelected(transporters);
        }
    }, [selected]);


    const handleToggle = (val) => {
        setLocalSelected((prev) =>
            prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
        );
    };

    const applyFilters = () => {
        const toSend =
            localSelected.length === 0 ? transporters : localSelected;
        onChange(toSend);
        onClose();
    };



    return (
        <div style={{ marginTop: 10 }}>
            <strong>Przewoźnicy:</strong>
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 10 }}>
                {transporters.map((code) => (
                    <label key={code} style={{ display: "block", marginBottom: 6 }}>
                        <input
                            type="checkbox"
                            value={code}
                            checked={localSelected.includes(code)}
                            onChange={() => handleToggle(code)}
                        />{" "}
                        {code}
                    </label>
                ))}
                <div style={{ marginTop: 12 }}>
                    <button onClick={applyFilters}>Zastosuj</button>
                    <button onClick={onClose} style={{ marginLeft: 8 }}>
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TransportersFilters;
