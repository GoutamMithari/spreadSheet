import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Spreadsheet.css";

const Spreadsheet = () => {

  const numRows = 10;
  // const numCols = 11;
  const [numCols, setNumCols] = useState(11);
  // const columnLabels = ["", ...Array.from({ length: numCols }, (_, i) => String.fromCharCode(65 + i))];
  const getColumnLabels = (count) => ["", ...Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i))];

  const [data, setData] = useState(Array(10).fill().map(() => Array(11).fill(""))); // Extra column for output
  const [selectedRange, setSelectedRange] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  

  // Fetch data on load
  useEffect(() => {
    axios.get("http://localhost:5000/load")
      .then((response) => {
        if (Array.isArray(response.data)) {
          setData(response.data);
        } else {
          setData(Array(10).fill().map(() => Array(11).fill(""))); // Reset on error
        }
      })
      .catch(() => setData(Array(10).fill().map(() => Array(11).fill("")))); // Reset on API failure
  }, []);

  // Update cell value
  const handleChange = (row, col, value) => {
    setData(prevData =>
      prevData.map((r, rIdx) =>
        rIdx === row ? r.map((c, cIdx) => (cIdx === col ? value : c)) : r
      )
    );
  };

  // Save data to backend
  const handleSave = () => {
    axios.post("http://localhost:5000/save", data);
  };

  // Refresh/reset spreadsheet
  const handleRefresh = () => {
    setData(Array(10).fill().map(() => Array(11).fill("")));
    setSelectedRange([]);
    setSelectedCell(null);
  };

  // Perform calculations (SUM, AVG, MAX, MIN, COUNT)
  const calculateFunction = (func) => {
    const values = selectedRange
      .map(([row, col]) => Number(data[row][col]))
      .filter(Number.isFinite);

    let result;
    switch (func) {
      case "SUM": result = values.reduce((a, b) => a + b, 0); break;
      case "AVERAGE": result = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; break;
      case "MAX": result = Math.max(...values); break;
      case "MIN": result = Math.min(...values); break;
      case "COUNT": result = values.length; break;
      default: result = "Error";
    }

    if (selectedCell) {
      handleChange(selectedCell[0], 10, result); // Store result in output column
    }
  };

  // Text functions (Trim, Uppercase, Lowercase)
  const applyTextFunction = (func) => {
    if (selectedCell) {
      const [row, col] = selectedCell;
      let value = data[row][col] || "";
      switch (func) {
        case "TRIM": value = value.trim(); break;
        case "UPPER": value = value.toUpperCase(); break;
        case "LOWER": value = value.toLowerCase(); break;
        default: return;
      }
      handleChange(row, col, value);
    }
  };

  // Remove duplicate rows
  const removeDuplicates = () => {
    const uniqueRows = data.filter(
      (row, index, self) => index === self.findIndex((r) => JSON.stringify(r) === JSON.stringify(row))
    );
    setData(uniqueRows);
  };

  // Find & Replace (supports partial matches)
  const findAndReplace = () => {
    if (!findText) return;
    const regex = new RegExp(findText, "g");
    setData(prevData =>
      prevData.map(row => row.map(cell => cell.replace(regex, replaceText)))
    );
  };

  // Handle cell selection
  const handleCellClick = (rowIndex, colIndex) => {
    setSelectedCell([rowIndex, colIndex]);
    setSelectedRange(prev =>
      prev.some(([r, c]) => r === rowIndex && c === colIndex) ? prev : [...prev, [rowIndex, colIndex]]
    );
  };

  // resize add, delete

  const addRow = () => {
    setData(prevData => [...prevData, Array(prevData[0].length).fill("")]);
  };

  const deleteRow = (index) => {
    if (data.length > 1) {
      setData(prevData => prevData.filter((_, i) => i !== index));
    }
  };

  // const addColumn = () => {
  //   setData(prevData => prevData.map(row => [...row, ""]));
  // };

  // const deleteColumn = (index) => {
  //   if (data[0].length > 1) {
  //     setData(prevData => prevData.map(row => row.filter((_, i) => i !== index)));
  //   }
  // };
  const addColumn = () => {
    setData(prevData => prevData.map(row => [...row, ""])); // Add new empty column
    setNumCols(prevCols => prevCols + 1); // Increase column count
  };
  
  const deleteColumn = () => {
    if (numCols > 1) {
      setData(prevData => prevData.map(row => row.slice(0, -1))); // Remove last column
      setNumCols(prevCols => prevCols - 1); // Decrease column count
    }
  };
  return (
    <div className="spreadsheet-container">
      <div className="toolbar">
        <button onClick={addRow}>Add Row</button>
        <button onClick={() => deleteRow(data.length - 1)}>Delete Row</button>
        <button onClick={addColumn}>Add Column</button>
        <button onClick={() => deleteColumn(data[0].length - 1)}>Delete Column</button>
        <button onClick={handleRefresh}>Refresh</button>
        <button onClick={() => calculateFunction("SUM")}>SUM</button>
        <button onClick={() => calculateFunction("AVERAGE")}>AVERAGE</button>
        <button onClick={() => calculateFunction("MAX")}>MAX</button>
        <button onClick={() => calculateFunction("MIN")}>MIN</button>
        <button onClick={() => calculateFunction("COUNT")}>COUNT</button>
        <button onClick={() => applyTextFunction("TRIM")}>Trim</button>
        <button onClick={() => applyTextFunction("UPPER")}>Uppercase</button>
        <button onClick={() => applyTextFunction("LOWER")}>Lowercase</button>
        <input type="text" placeholder="Find" value={findText} onChange={(e) => setFindText(e.target.value)} />
        <input type="text" placeholder="Replace" value={replaceText} onChange={(e) => setReplaceText(e.target.value)} />
        <button onClick={removeDuplicates}>Remove Duplicates</button>
        <button onClick={findAndReplace}>Find & Replace</button>
        <button className="saveBtn" onClick={handleSave}>Save</button>
        <button className="saveBtn" onClick={handleRefresh}>Refresh</button>
      </div>
      <div className="table-container">
      <table className="spreadsheet-table">
      <thead>
      <tr>
          {getColumnLabels(numCols).map((label, index) => (
            <th key={index}>{label}</th>
          ))}
        </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="row-number">{rowIndex + 1}</td>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={`spreadsheet-cell ${selectedRange.some(([r, c]) => r === rowIndex && c === colIndex) ? "selected-cell" : ""} ${colIndex === 10 ? "output-column" : ""}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
                    readOnly={colIndex === 10} // Output column read-only
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default Spreadsheet;
