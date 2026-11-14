#!/usr/bin/env python3
"""
Builds the Video 2 voiceover script from src/data/metros.json, so every number said out loud comes from the data.

    python3 scripts/video2/build_script.py

Writes
    scripts/lines.csv              id,type,text  (the exact words to record; vo_layout.py reads this)
    scripts/video2/SCRIPT.md       the same script, readable, with word counts and a numbers-check table

Every claim of the form "highest / lowest / only one below average / same as" is asserted against the data below, so if the
data changes (for example the 2025 release) the build fails instead of quietly saying something false.
"""
import csv
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
D = json.load(open(os.path.join(ROOT, 'src', 'data', 'metros.json')))
M = {m['name']: m for m in D['metros']}
ORDER = [m['name'] for m in sorted(D['metros'], key=lambda m: m['rank'])]
assert ORDER == ['Houston', 'Atlanta', 'Philadelphia', 'Dallas', 'Phoenix', 'Chicago', 'Washington', 'New York', 'Los Angeles', 'Miami'], ORDER

# ------------------------------------------------------------------ numbers to spoken words
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'zero ten twenty thirty forty fifty sixty seventy eighty ninety'.split()


def w(n):
    n = int(round(n))
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ('-' + ONES[n % 10] if n % 10 else '')
    if n < 1000:
        return ONES[n // 100] + ' hundred' + (' ' + w(n % 100) if n % 100 else '')
    return w(n // 1000) + ' thousand' + (' ' + w(n % 1000) if n % 1000 else '')


def usd(n):
    return w(n) + ' dollars'


def dec1(x):
    s = f'{x:.1f}'
    a, b = s.split('.')
    return f'{w(int(a))} point {ONES[int(b)]}'


def pct(x):
    return w(round(x)) + ' percent'


def above(index):
    """How far an index is above (+) or below (-) the national average of 100, in whole percent."""
    return round(index - 100)


# ------------------------------------------------------------------ facts, each checked against the data
bp = {n: M[n]['buyingPower50k'] for n in ORDER}
lvl = {n: M[n]['bea']['allItems'] for n in ORDER}
rentidx = {n: M[n]['bea']['rents'] for n in ORDER}
goods = {n: M[n]['bea']['goods'] for n in ORDER}
serv = {n: M[n]['bea']['otherServices'] for n in ORDER}
rent = {n: M[n]['census']['medianGrossRent'] for n in ORDER}
wage = {n: M[n]['wage']['medianAnnual'] for n in ORDER}
share = {n: M[n]['rentShareOfWagePct'] for n in ORDER}
wap = {n: M[n]['wageAfterPrices'] for n in ORDER}
twist = {n: M[n]['twistRank'] for n in ORDER}

argmax = lambda d: max(d, key=d.get)
argmin = lambda d: min(d, key=d.get)
assert argmax(lvl) == 'Miami' and argmin(lvl) == 'Houston'
assert [n for n in ORDER if lvl[n] < 100] == ['Houston']
assert argmax(rentidx) == 'Los Angeles'
assert argmax(goods) == 'New York' and argmin(goods) == 'Phoenix'
assert sorted(goods, key=goods.get)[-2] == 'Chicago'  # second highest goods prices
assert argmin(serv) == 'Houston'
assert argmax(wage) == 'Washington' and argmin(wage) == 'Miami'
assert argmax(share) == 'Miami'
assert rent['Houston'] == rent['Chicago']
assert sorted(rent.values())[2] == rent['Philadelphia']  # third lowest median rent of the ten
assert twist['Washington'] == 1 and twist['New York'] == 2 and twist['Philadelphia'] == 3
assert twist['Houston'] == 6 and twist['Miami'] == 10
assert bp['Houston'] - bp['Atlanta'] == 700 and bp['Houston'] - bp['Miami'] == 6900
assert all(lvl[n] - 100 < 3 for n in ['Philadelphia', 'Atlanta', 'Houston'])  # "none is three percent above average"
assert sum(1 for n in ORDER if share[n] > 40) == 5  # Miami, Los Angeles, Phoenix, Atlanta, Dallas
assert round(share['Miami']) == 52 and round(share['Chicago']) == 34
gap = bp['Houston'] - bp['Miami']
wage_up = round((wage['Washington'] / wage['Houston'] - 1) * 100)  # 41
price_up = round((lvl['Washington'] / lvl['Houston'] - 1) * 100)  # 10
assert (wage_up, price_up) == (41, 10), (wage_up, price_up)
# the formula in the takeaway, worked on Miami
assert abs(50000 * 100 / lvl['Miami'] - bp['Miami']) <= 100

assert sorted(share, key=share.get)[:2] == ['Chicago', 'Washington']  # 'at the other end' of the rent-share list
assert round(above(serv['Dallas'])) == 0 and round(above(lvl['Dallas'])) == 3  # Dallas: other services at the national average
assert all(share[n] > share['Washington'] for n in ORDER if n not in ('Washington', 'Chicago'))
L = []  # (section, id, text)


def add(section, cid, text):
    t = ' '.join(text.split())
    L.append((section, cid, t[0].upper() + t[1:]))


# ------------------------------------------------------------------ 1. COLD OPEN
add('Cold open', 's01_cold_open_a', 'Two people. Both earn exactly fifty thousand dollars a year.')
add('Cold open', 's01_cold_open_b', f'In one city, that buys what {usd(bp["Houston"])} would buy at average American prices. In the other? Only {usd(bp["Miami"])}.')
add('Cold open', 's01_cold_open_c', f'A gap of {usd(gap)}, just from where they live.')
add('Cold open', 's01_cold_open_d', "I ranked ten big American metro areas by exactly this. And the winner of the countdown stops winning once I add one more number.")
add('Cold open', 's01_cold_open_e', "Let's start at the bottom.")

# ------------------------------------------------------------------ 2. METHOD
add('Method', 's02_method_a', 'First, the method. The Bureau of Economic Analysis, or BEA, measures how expensive every metro area is, with the national average set at one hundred.')
add('Method', 's02_method_b', 'Above one hundred means prices run higher than average. Below, lower. Multiply your salary by one hundred, divide by that number, and you get what your pay is really worth at average American prices.')
add('Method', 's02_method_c', 'That price level covers everything: rent, goods, and services, each with its own index. All the data is from twenty twenty-four, and these are metro areas, not just city limits.')
add('Method', 's02_method_d', "Later, I'll add the actual rent in dollars from the Census Bureau, and wages from the Bureau of Labor Statistics. That's where it gets interesting.")

# ------------------------------------------------------------------ 3. COUNTDOWN
# 3-clip cities (#10 to #8)
add('#10 Miami', 'r10_miami_a', f'Number ten. Miami. Your fifty thousand dollars buys what {usd(bp["Miami"])} would at average American prices. Last place.')
add('#10 Miami', 'r10_miami_b', f'Miami has the highest price level of all ten: {dec1(lvl["Miami"])}. Rent prices run about {pct(above(rentidx["Miami"]))} above the national average, and the median rent is {usd(rent["Miami"])} a month.')
add('#10 Miami', 'r10_miami_c', 'Next: the city with the most expensive rent of all ten.')

add('#9 Los Angeles', 'r09_la_a', f'Number nine. Los Angeles. Your fifty thousand buys what {usd(bp["Los Angeles"])} would.')
add('#9 Los Angeles', 'r09_la_b', f'Los Angeles has the highest rent prices on this list, {pct(above(rentidx["Los Angeles"]))} above the national average. The median rent is {usd(rent["Los Angeles"])} a month.')
add('#9 Los Angeles', 'r09_la_c', 'Next: the city where even everyday goods cost ten percent more.')
assert above(goods['New York']) == 10

add('#8 New York', 'r08_ny_a', f'Number eight. New York. Your fifty thousand buys what {usd(bp["New York"])} would.')
add('#8 New York', 'r08_ny_b', f'Everyday goods here cost about {pct(above(goods["New York"]))} more than the national average, the highest of the ten. Median rent: {usd(rent["New York"])} a month.')
add('#8 New York', 'r08_ny_c', "Number seven is expensive too. But keep an eye on that city. It comes back at the end.")

# 5-clip cities (#7 to #1): name, number, reason, rent, bridge
add('#7 Washington', 'r07_dc_a', 'Number seven. Washington, DC.')
add('#7 Washington', 'r07_dc_b', f'{usd(bp["Washington"])} of buying power. Prices run about {pct(above(lvl["Washington"]))} above average.')
add('#7 Washington', 'r07_dc_c', f'The culprit is rent: {pct(above(rentidx["Washington"]))} above the national average.')
add('#7 Washington', 'r07_dc_d', f'Median rent: {usd(rent["Washington"])} a month. But look at the median wage: {usd(wage["Washington"])}. By far the highest of the ten. Remember that number.')
add('#7 Washington', 'r07_dc_e', 'Next: a city where rent is not the problem.')

add('#6 Chicago', 'r06_chi_a', 'Number six. Chicago.')
add('#6 Chicago', 'r06_chi_b', f'{usd(bp["Chicago"])} of buying power.')
add('#6 Chicago', 'r06_chi_c', f'Rent prices here are only {pct(above(rentidx["Chicago"]))} above average. Goods, though, cost {pct(above(goods["Chicago"]))} more than the national average, second only to New York.')
add('#6 Chicago', 'r06_chi_d', f'Median rent: {usd(rent["Chicago"])} a month. Hold on to that figure.')
add('#6 Chicago', 'r06_chi_e', 'Next: the cheapest goods on the list. With a catch.')

add('#5 Phoenix', 'r05_phx_a', 'Number five. Phoenix.')
add('#5 Phoenix', 'r05_phx_b', f'{usd(bp["Phoenix"])} of buying power.')
add('#5 Phoenix', 'r05_phx_c', f'Phoenix has the cheapest goods of all ten, {pct(abs(above(goods["Phoenix"])))} below the national average. But rent prices run {pct(above(rentidx["Phoenix"]))} above it.')
add('#5 Phoenix', 'r05_phx_d', f'Median rent: {usd(rent["Phoenix"])} a month.')
add('#5 Phoenix', 'r05_phx_e', "That's half the list, and number one is still hiding. Before the top four, I need to show you something about rent.")

# ------------------------------------------------------------------ 4. PATTERN BREAK (rent against paycheck)
add('Pattern break', 's03_break_a', f"Forget prices for a moment. Take a year of typical rent, and compare it with the typical paycheck. In Miami, it's {pct(share['Miami'])}. {w(share['Miami']).capitalize()} cents of every dollar a typical worker earns, before taxes.")
assert round(share['Miami']) == 52
add('Pattern break', 's03_break_b', f"Los Angeles, {pct(share['Los Angeles'])}. Phoenix, {w(share['Phoenix'])}. At the other end: Washington, {w(share['Washington'])}. Chicago, {w(share['Chicago'])}. Rent isn't just a price. It's a bite out of the paycheck.")

# ------------------------------------------------------------------ 5. COUNTDOWN, TOP FOUR
add('#4 Dallas', 'r04_dal_a', 'Number four. Dallas.')
add('#4 Dallas', 'r04_dal_b', f'{usd(bp["Dallas"])} of buying power. Prices are about {pct(above(lvl["Dallas"]))} above average.')
add('#4 Dallas', 'r04_dal_c', f'Rent prices are {pct(above(rentidx["Dallas"]))} above average, but other services sit right at the national average.')
add('#4 Dallas', 'r04_dal_d', f'Median rent: {usd(rent["Dallas"])} a month.')
add('#4 Dallas', 'r04_dal_e', 'Now the top three. None of them is even three percent above the national average.')

add('#3 Philadelphia', 'r03_phl_a', 'Number three. Philadelphia.')
add('#3 Philadelphia', 'r03_phl_b', f'{usd(bp["Philadelphia"])} of buying power. Prices are just {dec1(lvl["Philadelphia"] - 100)} percent above the national average.')
add('#3 Philadelphia', 'r03_phl_c', f'Goods here cost {pct(abs(above(goods["Philadelphia"])))} less than the national average. Rent prices are {pct(above(rentidx["Philadelphia"]))} higher, but that is mild next to Miami or Los Angeles.')
add('#3 Philadelphia', 'r03_phl_d', f'Median rent: {usd(rent["Philadelphia"])} a month, the third lowest of the ten.')
add('#3 Philadelphia', 'r03_phl_e', "Next: the city where fifty thousand dollars is, almost to the dollar, fifty thousand dollars.")
assert bp['Atlanta'] == 50000

add('#2 Atlanta', 'r02_atl_a', 'Number two. Atlanta.')
add('#2 Atlanta', 'r02_atl_b', f'Fifty thousand dollars of buying power. At {dec1(lvl["Atlanta"])}, Atlanta is basically the national average.')
add('#2 Atlanta', 'r02_atl_c', f'Rent prices are {pct(above(rentidx["Atlanta"]))} above average, and other services cost about {pct(abs(above(serv["Atlanta"])))} less.')
add('#2 Atlanta', 'r02_atl_d', f'Median rent: {usd(rent["Atlanta"])} a month.')
add('#2 Atlanta', 'r02_atl_e', f'And number one beats it by {usd(bp["Houston"] - bp["Atlanta"])}. Take a guess.')

add('#1 Houston', 'r01_hou_a', 'Number one. Houston.')
add('#1 Houston', 'r01_hou_b', f'{usd(bp["Houston"])} of buying power. A price level of {dec1(lvl["Houston"])}, the only one below one hundred.')
add('#1 Houston', 'r01_hou_c', f'Rent prices are only {dec1(rentidx["Houston"] - 100)} percent above average, and other services cost about {pct(abs(above(serv["Houston"])))} less than average, the cheapest of the ten.')
add('#1 Houston', 'r01_hou_d', f'Median rent: {usd(rent["Houston"])} a month. Exactly the same as Chicago.')
add('#1 Houston', 'r01_hou_e', f"Houston wins. Next to Miami, your salary is worth {usd(gap)} more.")
add('#1 Houston', 'r01_hou_f', "But that's only half the story. So far, I've treated everyone as earning fifty thousand dollars. What happens when I use what people actually earn?")

# ------------------------------------------------------------------ 6. THE TWIST
add('Twist', 's04_twist_a', "Wages differ from city to city. So I took each city's median wage from the Bureau of Labor Statistics, and divided it by the price level. That's my own calculation, not an official statistic. It asks one thing: what is a typical paycheck worth after prices?")
add('Twist', 's04_twist_b', f'Houston first. The median wage is {usd(wage["Houston"])}. After prices, that is worth {usd(wap["Houston"])}. Cheap city, modest pay. Houston drops from number one to number {w(twist["Houston"])}.')
add('Twist', 's04_twist_c', f"Now remember Washington. Median wage: {usd(wage['Washington'])}. That is {pct(wage_up)} more than Houston, while prices are only {pct(price_up)} higher than Houston's. After prices: {usd(wap['Washington'])}. The new number one.")
add('Twist', 's04_twist_d', f'New York climbs to number two, at {usd(wap["New York"])}. Philadelphia is third, at {usd(wap["Philadelphia"])}.')
add('Twist', 's04_twist_e', f'And Miami? Last in the first ranking. Last again. The highest prices, the lowest median wage, {usd(wage["Miami"])}, and a year of rent that equals {pct(share["Miami"])} of it. After prices: {usd(wap["Miami"])}.')
add('Twist', 's04_twist_f', 'So cheap is not automatically better. What matters is the gap between what you earn and what things cost. Houston has the lowest prices. On this measure, Washington is where a typical paycheck goes the furthest.')

# ------------------------------------------------------------------ 7. TAKEAWAY
add('Takeaway', 's05_takeaway_a', f"So how do you use this? Rule one: don't compare salaries. Compare what they buy. Multiply your salary by one hundred, and divide by your city's price level. Fifty thousand dollars in Miami comes out at {usd(bp['Miami'])}.")
add('Takeaway', 's05_takeaway_b', "Rule two: put rent next to your own pay. In five of these ten cities, a year of typical rent takes more than forty percent of the typical wage. When it does, prices are only part of the problem.")
add('Takeaway', 's05_takeaway_c', f"Rule three: judge a job offer in another city the same way. Washington's median wage is {pct(wage_up)} above Houston's, while its prices are only {pct(price_up)} higher than Houston's. Then run your own offer through the formula.")
add('Takeaway', 's05_takeaway_d', "These are medians for each metro area, in twenty twenty-four, so your own situation will differ. The formula and every source are in the description.")

# ------------------------------------------------------------------ 8. OUTRO
add('Outro', 's06_outro_a', f'Quick recap. The cheapest prices: Houston, with {usd(bp["Houston"])} of buying power. The best paycheck after prices: Washington, at {usd(wap["Washington"])}. The hardest on your wallet: Miami, last in both.')
add('Outro', 's06_outro_b', "Which city surprised you most? Tell me in the comments. This is general information, not financial advice. New price data is due in December. If it covers metro areas, I may update this ranking, so subscribe to catch it.")

# ------------------------------------------------------------------ write files
os.makedirs(os.path.join(ROOT, 'scripts'), exist_ok=True)
with open(os.path.join(ROOT, 'scripts', 'lines.csv'), 'w', newline='') as f:
    wr = csv.writer(f)
    wr.writerow(['id', 'type', 'text'])
    for _, cid, t in L:
        wr.writerow([cid, 'voice', t])

WPM = 145
sections = []
for s, _, _ in L:
    if s not in sections:
        sections.append(s)
total = 0
out = ['# Video 2 voiceover script', '',
       'Generated by `scripts/video2/build_script.py` from `src/data/metros.json`. Do not edit the numbers here; edit the generator or the data, then re-run it.',
       'Numbers are written as words, the way to say them. Record each line as its own clip, in order. Name each file `NNN_<id>.wav` (NNN = line number, three digits).', '']
n = 0
for s in sections:
    rows = [(cid, t) for sec, cid, t in L if sec == s]
    wc = sum(len(t.split()) for _, t in rows)
    total += wc
    out.append(f'## {s}  ({wc} words, about {wc / WPM * 60:.0f} s)')
    out.append('')
    for cid, t in rows:
        n += 1
        out.append(f'{n:03d}_{cid}  \n> {t}')
        out.append('')
out.insert(4, f'**Total: {total} words, about {total / WPM:.1f} minutes at {WPM} words per minute, in {len(L)} clips.**')
out.insert(5, '')
open(os.path.join(HERE, 'SCRIPT.md'), 'w').write('\n'.join(out) + '\n')
print(f'{len(L)} clips, {total} words, about {total / WPM:.1f} min at {WPM} wpm')
for s in sections:
    print(f'  {s:16s} {sum(len(t.split()) for sec, _, t in L if sec == s):4d} words')
