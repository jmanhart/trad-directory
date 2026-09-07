-- Replace the placeholder styles catalog with the curated tattoo-style set.
--
-- Data-only change: no schema change (styles.description already exists). Safe to
-- swap wholesale because artist_styles is empty (no tags reference the old rows).
-- If tags ever exist, this must become a slug-mapped upsert instead of delete+insert.
--
-- Rollback: restore from the pre-push backup (backups/prod-*-styles.sql).

delete from "public"."artist_styles";
delete from "public"."styles";

insert into "public"."styles" ("slug", "name", "sort_order", "is_active", "description") values
  (
    'american-traditional',
    'American Traditional',
    1,
    true,
    $$The classic Sailor Jerry canon. Bold black outlines, a limited palette (red, green, yellow, a little blue), and heavy black shading with minimal detail so it ages well. Iconography: eagles, anchors, swallows, roses, daggers, panthers, pin-ups, hearts, and ships. Built for legibility from across a room and to hold up over decades of skin aging.$$
  ),
  (
    'neo-traditional',
    'Neo-Traditional',
    2,
    true,
    $$The direct descendant of American Traditional. Keeps the bold outlines and iconography but widens everything — bigger color palette, more line-weight variation, more illustrative detail, and dimension American Traditional avoids. Art Nouveau and illustration influence: a rose with real rendering rather than three flat tones.$$
  ),
  (
    'japanese-traditional',
    'Japanese Traditional (Irezumi / Tebori)',
    3,
    true,
    $$A separate tradition, not a branch of the American one. Large-scale, body-flowing compositions (sleeves, back pieces, bodysuits) governed by strict rules of subject and background. Motifs carry meaning — koi, dragons, tigers, snakes, Fu dogs, hannya masks, chrysanthemums, peonies — tied together by wind bars, water, and finger waves. Tebori refers to the hand-poked method. Also called Oriental or Asian Traditional.$$
  ),
  (
    'european-traditional',
    'European Traditional',
    4,
    true,
    $$The old-world root American Traditional grew out of, plus its modern folk revival. The classic side shares the bold-line, limited-palette DNA (British and Northern European port lineage — heraldry, crests, military insignia, roses, religious and patriotic emblems); the contemporary look leans on medieval and Renaissance printmaking — woodcut and engraving styles, Dürer, memento mori — in fine blackwork with cross-hatching and stippling.$$
  ),
  (
    'horror',
    'Horror',
    5,
    true,
    $$A theme done across every style — monsters, skulls, the macabre and grotesque, Universal-monster and slasher icons, reapers, demons, and gore. Ranges from bold traditional horror to black-and-grey realism and neo-traditional renderings, leaning on deep blacks, dramatic shadow, and unsettling detail. Overlaps with dark art, occult, and macabre work.$$
  ),
  (
    'blackwork-tribal',
    'Blackwork / Tribal',
    6,
    true,
    $$The oldest traditions of all (Polynesian, Samoan, Maori/Ta moko, Borneo, Filipino Kalinga). Solid black and cultural pattern languages, often deeply meaningful and in some cases culturally protected.$$
  ),
  (
    'chicano',
    'Chicano',
    7,
    true,
    $$Fine single-needle black-and-grey out of Southern California. Script lettering, religious imagery, roses, portraits, and lowrider culture. A tradition in its own right rather than a spin on American Traditional.$$
  ),
  (
    'traditional-blackwork',
    'Traditional Blackwork / Black Traditional',
    8,
    true,
    $$American Traditional forms done entirely in black, no color.$$
  );
