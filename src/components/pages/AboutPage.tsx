import styles from "./AboutPage.module.css";

export default function AboutPage() {
  return (
    <div className={styles.container}>
      {/* <h1 className={styles.title}>Trad Tattoo Directory</h1>
      <HeroMessage /> */}
      <h2 className={styles.subtitle}>What is the Trad Directory?</h2>
      <p className={styles.description}>
        Let’s be real...Instagram’s search fucking sucks. This directory exists
        to help people find solid traditional tattoo artists and shops by
        location, and hopefully make the act of finding artists easier.
      </p>
      <p className={styles.description}>
        <strong>Full transparency I'm not a tattoo artist.</strong> I don’t even
        work in the industry. I just like making silly shit for the internet. If
        this directory helps someone find an artist doing killer work, awesome.
        Because honestly as terrible as Instagram search is bad tattoos are way
        worse.
      </p>
      <p className={styles.description}>
        This site will never have ads, and I’ll never sell the data I’ve
        painstakingly collected over the years. Why? Because that’s shitty and
        dumb.
      </p>
      <p className={styles.description}>
        Now go finish that sleeve, start planning that back piece, and don’t
        forget to tip your artist.
      </p>
      <p className={styles.description}>This is still very much a work in progress. If you see anything wrong or want to say hi drop me a message on <a href="https://www.instagram.com/trad_tattoo_directory/" target="_blank" rel="noopener noreferrer">Instagram</a>.</p>
    </div>
  );
}
