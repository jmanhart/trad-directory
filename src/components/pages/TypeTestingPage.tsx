import { useState } from "react";
import styles from "./TypeTestingPage.module.css";
import TypeNumber from "../common/TypeNumber";

export default function TypeTestingPage() {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, "");
    setInputValue(value);
  };

  const renderTypeLetters = () => {
    if (!inputValue) {
      return (
        <div className={styles.emptyState}>
          <p>Type numbers above to see the type letters</p>
        </div>
      );
    }

    return (
      <div className={styles.lettersContainer}>
        <TypeNumber
          value={inputValue}
          variant="red"
          className={styles.typeNumber}
        />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Type Testing</h1>
      <p className={styles.description}>
        Enter numbers below to see the type letters from the TYPE directory.
      </p>
      
      <div className={styles.inputContainer}>
        <label htmlFor="numberInput" className={styles.label}>
          Enter Numbers:
        </label>
        <input
          id="numberInput"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type numbers (0-9)..."
          className={styles.input}
          autoFocus
        />
        {inputValue && (
          <div className={styles.inputInfo}>
            Showing {inputValue.length} {inputValue.length === 1 ? "digit" : "digits"}
          </div>
        )}
      </div>

      <div className={styles.displayContainer}>
        {renderTypeLetters()}
      </div>
    </div>
  );
}
