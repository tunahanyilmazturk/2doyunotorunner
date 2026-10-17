# Idle Runner — özel ikon seti

210 original generated icon cells in four transparent PNG atlases. Generated with the built-in ImageGen tool. No external icon pack or emoji image exports.

## Kullanım

- Koleksiyon: http://localhost:5174/assets/icons/catalog.html
- `manifest.json`: all 210 identifiers, Turkish labels and zero-based atlas coordinates.
- `src/ui/icons.js`: UI icon renderer, equipment-level selection and legacy text decorations.
- `src/render/IconRenderer.js`: the same atlas art in Canvas combat labels and banners.
- Equipment visual tiers use item level thresholds 1, 6, 14, 25, 40, 60, 85. Rarity remains represented by the existing item-slot border, independent of appearance.
- Achievements use 21 group emblems; tier progress remains in the existing pips and Roman-numeral titles.
- No save format or balance changes.

## Prompt set

Shared production specification:

Production sprite atlas for a 2D pixel fantasy idle RPG. Strict equal edge-to-edge cell grid. Transparent background around every object. No grid lines, panels, tile backgrounds, text, numbers, labels, watermarks, or outer margins. One centered icon in each cell with empty padding, no overlap. Crisp handcrafted 32-bit pixel art, chunky square pixels, dark plum-black outlines, upper-left highlights, restrained four-tone ramps. Jewel greens/purples, warm antique gold, steel blue, brown leather, crimson flames. Readable at 24–32 px; no photorealistic, vector, smoothed or 3D rendering.

### weapons-v1.png

5 columns × 7 rows. Strict left-to-right subject order; each following line is one row. Progression changes silhouettes and ornament, not only color.

1. rusty sword, wood chopping axe, wooden mallet, sharpened wooden staff/spear, rusty dagger
2. iron sword, iron axe, iron mace, iron spear, iron dagger
3. polished steel sword, battle axe, war hammer, cavalry lance, assassin dagger
4. blue glowing rune sword, rune axe, rune hammer, rune spear, rune dagger
5. cyan mithril sword, mithril axe, mithril hammer, mithril spear, mithril dagger
6. dragon fang sword, dragon axe, dragon hammer, dragon spear, dragon claw dagger with red/orange bone and scale motifs
7. celestial violet/gold star sword, star axe, star hammer, star spear, star dagger

### equipment-v1.png

9 columns × 7 rows. Strict left-to-right subject order; each following line is one row. Progression changes silhouettes and ornament, not only color.

1. leather cap, cloth shirt, sandals, copper ring, wooden talisman, ragged cape, wooden shield, cloth gloves, rope belt
2. iron helmet, leather armor, leather boots, silver ring, bone necklace, traveler cloak, iron shield, leather gloves, leather belt
3. steel helmet, chainmail, iron boots, gold ring, silver necklace, hunter cloak, tower shield, chain gloves, studded belt
4. knight helmet, plate armor, traveler boots, ruby ring, emerald necklace, shadow cloak, rune shield, iron gauntlets, warrior belt
5. mithril crown, mithril armor, wind boots, diamond ring, soul necklace, royal cape, mithril shield, rune gloves, champion belt
6. dragon helmet, dragon scale armor, dragon boots, ancient ring, ancient amulet, phoenix cape, dragon shield, dragon claws, ancient belt
7. celestial star crown, star armor, star boots, star signet, star heart necklace, star cape, star shield, star gloves, star belt

### powers-v1.png

8 columns × 6 rows. Strict left-to-right subject order; each following line is one row. Progression changes silhouettes and ornament, not only color.

1. Power Strike: sword smashing a yellow explosive impact; Frenzy: flaming crimson berserker fist; Gold Rush: rain of golden coins from a cloud; Divine Heal: emerald heart with angel wings and holy light; Apocalypse Meteor: burning orange meteor descending diagonally; Combat branch: crossed red swords; Survival branch: emerald shield and oak leaves; Wealth branch: gold overflowing coin pouch
2. Gear branch: adventurer backpack with weapon straps; Arcane branch: purple wizard tome and crystal; Power upgrade: mighty steel blade with upward red aura; Vitality upgrade: red heart inside iron frame; Defense upgrade: steel shield with blue rivets; Regeneration upgrade: green heart wrapped in healing vines; Haste upgrade: silver winged boot with speed trails; Precision upgrade: golden eye with bullseye pupil
3. Brutality upgrade: cracked red skull and impact shards; Greed upgrade: claw grasping gold coins; Fortune upgrade: jade four leaf clover with small sparkles; Vampirism upgrade: crimson blood drop between fangs; Giant Slayer upgrade: greatsword piercing giant crown; Evasion upgrade: hooded shadow vanishing in emerald smoke; Sharp Sword soul node: sharpened blade on whetstone; Deadly Focus soul node: single red focused eye in violet crystal
4. Boss Hunter soul node: broken crown on sword tip; Borrowed Time soul node: gold hourglass with blue sand; Savage Might soul node: roaring red wolf head; Iron Body soul node: armored red heart; Shield Bearer soul node: tower shield with gold handle; Escape Master soul node: footprint dissolving into leaves; Divine Healing soul node: radiant green chalice and cross-shaped sparkle; Thorn Armor soul node: steel chest armor covered in green thorns
5. Gold Scent soul node: gold coin with flowing golden scent trail; Soul Harvest soul node: spectral purple soul over sickle; Gold Legacy soul node: ancient locked gold vault; Fast Start soul node: winged trail marker with sunrise; Bargainer soul node: handshake and coin; Wide Bag soul node: expanded leather satchel with extra pouches; Glove Mastery soul node: raised enchanted gauntlet; Belt Buckle soul node: ornate glowing square bronze buckle
6. Traveler Cape soul node: green hooded cape and compass; Double Loot soul node: two gift sacks with emerald gems; Magic Flow soul node: spiraling purple rune vortex; Golden Rain soul node: gold cloud with falling coin streams; Spell Power soul node: violet crystal orb grasped by a claw; Battle Call soul node: curved bronze war horn with crimson ribbon; Meteor Mastery soul node: molten meteor inside ancient purple rune circle; Thorns stat: green spiked bramble wrapping a metal spike

### interface-v1.png

8 columns × 8 rows. Strict left-to-right subject order; each following line is one row. Progression changes silhouettes and ornament, not only color.

1. Character menu: small heroic adventurer bust wearing leather armor; Upgrades menu: upward golden chevrons behind a steel blade; Skills menu: open violet spellbook with glowing rune; Forge menu: blacksmith hammer striking anvil; Shop menu: medieval merchant stall with burgundy awning; Achievements menu: golden trophy with laurel; Soul Tree menu: magical emerald tree with purple roots; Settings menu: antique bronze gear with central blue gem
2. Currency: stack of gold coins; Soul currency: friendly lavender wisp with glowing eyes; Health: crimson heart; Save: parchment scroll with wax seal and quill; Lock: closed bronze padlock; Equip Best: lightning bolt behind armor; Statistics: parchment chart with three gold bars; Inventory: sturdy leather backpack
3. Hunter achievement: sword over defeated beast skull medallion; Explorer achievement: rolled map with compass medallion; Boss Hunter achievement: crowned horned skull medallion; Elite Hunter achievement: silver star with red gem medallion; Rich achievement: gold overflowing treasury medallion; Collector achievement: backpack filled with gems medallion; Legend Seeker achievement: golden radiant legendary gem medallion; Blacksmith achievement: hammer and anvil medallion
4. Mage achievement: violet wizard hat with star medallion; Reborn achievement: spectral phoenix medallion; Mythic Hunter achievement: crimson crystal in ornate gold medallion; Full Equipment achievement: full suit of plate armor medallion; Weapon Master achievement: crossed axe and sword medallion; Elite Expert achievement: six small elemental gems around eye medallion; Monster Scholar achievement: open bestiary with tiny creature head medallion; One Hit achievement: fist shattering stone medallion
5. Fast Executioner achievement: hourglass crossed by sword medallion; Shadow achievement: dark hood and emerald leaf medallion; Loyal Adventurer achievement: camp lantern and hourglass medallion; Soul Gardener achievement: glowing bonsai spirit tree medallion; Growth achievement: ascending three gold chevrons medallion; Wooden chest with iron latch; Heavy iron treasure chest with blue gem lock; Royal golden treasure chest with purple gem lock
6. Health potion: round red glass flask with cork; Wrath elixir: angular crimson flask with fire motif; Ironskin elixir: steel-gray reinforced flask with shield seal; Gold elixir: round golden honey flask with coin seal; Luck scroll: parchment with jade rune and green ribbon; Gift: tied treasure sack with ribbon; Game controls: medieval styled little gamepad; Keyboard: small brass keyboard
7. Refresh: two curved teal arrows; Sort: three stacked items with brass arrow; Automatic: circular rune gear surrounding play triangle; Combat status: crossed steel swords; Boss status: gold horned crown; Information: blue crystal with white i symbol; Audio: small gold bell; Warning: red triangular rune with exclamation mark
8. Export: parchment with outward arrow; Import: parchment with inward arrow; Reset: cracked hourglass with circular red arrow; Confirm: emerald check mark; Close: red diagonal cross; Expand menu: downward brass chevron; Collapse menu: upward brass chevron; Linked prerequisite: two linked silver chain rings

