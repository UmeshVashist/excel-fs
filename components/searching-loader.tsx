import styles from "./searching-loader.module.css"

export function SearchingLoader() {
  return (
    <div className={styles["loader-wrapper"]}>
      <span className={styles["loader-letter"]}>S</span>
      <span className={styles["loader-letter"]}>e</span>
      <span className={styles["loader-letter"]}>a</span>
      <span className={styles["loader-letter"]}>r</span>
      <span className={styles["loader-letter"]}>c</span>
      <span className={styles["loader-letter"]}>h</span>
      <span className={styles["loader-letter"]}>i</span>
      <span className={styles["loader-letter"]}>n</span>
      <span className={styles["loader-letter"]}>g...</span>

      <div className={styles["loader"]}></div>
    </div>
  )
}
