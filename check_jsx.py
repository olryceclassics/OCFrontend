from pathlib import Path
import re

path = Path('src/pages/ShopPage.jsx')
text = path.read_text('utf-8')
start = text.find('return (')
if start == -1:
    raise SystemExit('return ( not found')
html = text[start:]

positions = []
idx = 0
while True:
    open_idx = html.find('<div', idx)
    close_idx = html.find('</div>', idx)
    if open_idx == -1 and close_idx == -1:
        break
    if open_idx != -1 and (close_idx == -1 or open_idx < close_idx):
        positions.append(('open', open_idx))
        idx = open_idx + 4
    else:
        positions.append(('close', close_idx))
        idx = close_idx + 6

line_starts = [0]
for i,ch in enumerate(html):
    if ch == '\n':
        line_starts.append(i+1)

def line_of(offset):
    lo = 0
    hi = len(line_starts)-1
    while lo <= hi:
        mid = (lo+hi)//2
        if line_starts[mid] <= offset:
            lo = mid + 1
        else:
            hi = mid - 1
    return hi + 1

stack = []
delta = 0
for typ, pos in positions:
    line = line_of(pos)
    if typ == 'open':
        delta += 1
        stack.append((line, html[pos:pos+20].replace('\n',' ')))
    else:
        delta -= 1
        if delta < 0:
            print('negative at', line)
            break
        stack.pop()
    if delta > 1e6:
        break

print('delta', delta)
print('remaining opens', stack)
print('total open', sum(1 for t,p in positions if t=='open'))
print('total close', sum(1 for t,p in positions if t=='close'))
