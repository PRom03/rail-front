import { useState } from "react";

export const useSelectionStatus = (initial = "") => {

    const [value, setValue] = useState(initial);
    const [selected, setSelected] = useState(false);
    const [modified, setModified] = useState(false);

    const onManualChange = (val) => {
        setValue(val);
        if (selected) setModified(true);
    };

    const onSelect = (val) => {
        setValue(val);
        setSelected(true);
        setModified(false);
    };

    return {
        value,
        selected,
        modified,

        showIcon: selected && !modified,

        bindings: {
            value,
            onManualChange,
            onSelect,
        }
    };
};
