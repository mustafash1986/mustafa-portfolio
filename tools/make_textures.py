"""Generates the site's seamless PBR textures (albedo / normal / roughness) into assets/tex.
Run from the project root:  python tools/make_textures.py
Every noise field is built in the frequency domain, so all maps tile without seams."""
import os
import numpy as np
from PIL import Image

OUT = os.path.join('assets', 'tex')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def noise(n, beta=2.0, sx=1.0, sy=1.0, m=None):
    """Periodic fractal noise in [0,1]; sx/sy stretch it (sx>sy -> streaks along x)."""
    m = m or n
    fy = np.fft.fftfreq(n)[:, None] * sy
    fx = np.fft.fftfreq(m)[None, :] * sx
    f = np.sqrt(fx * fx + fy * fy)
    f[0, 0] = 1
    spec = np.fft.fft2(rng.standard_normal((n, m))) / f ** (beta / 2)
    spec[0, 0] = 0
    a = np.real(np.fft.ifft2(spec))
    return (a - a.min()) / (a.max() - a.min())


def normal_map(h, strength):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    n = np.dstack([-dx, dy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return ((n * .5 + .5) * 255).astype(np.uint8)


def save(name, arr, q=86):
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr)
    for size, suf in ((arr.shape[1], ''), (arr.shape[1] // 2, '-lo')):
        im = img if size == arr.shape[1] else img.resize((size, int(size * arr.shape[0] / arr.shape[1])), Image.LANCZOS)
        if im.mode == 'RGBA':
            im.save(os.path.join(OUT, f'{name}{suf}.webp'), 'WEBP', quality=q, method=6)
        else:
            im.save(os.path.join(OUT, f'{name}{suf}.jpg'), quality=q, optimize=True, progressive=True)


def tile_lines(n, cells, width):
    """1 on grout lines between `cells` x `cells` slabs, else 0 (periodic)."""
    c = np.arange(n) % (n // cells)
    line = (c < width) | (c >= n // cells - width)
    return (line[None, :] | line[:, None]).astype(float)


def slab_tint(n, cells, spread):
    ids = (np.arange(n) // (n // cells))
    t = rng.uniform(-spread, spread, (cells, cells))
    return t[ids[:, None], ids[None, :]]


def rgb(*c):
    return np.array(c, float)[None, None, :]


# ---- travertine floor: 2x2 polished slabs, horizontal veins, pores
N = 1024
veins = noise(N, 2.4, sx=1.6, sy=.18)
mott = noise(N, 2.0)
pores = noise(N, .6)
pore = np.clip((pores - .78) * 6, 0, 1)
grout = tile_lines(N, 2, 2)
t = slab_tint(N, 2, .04)
base = rgb(236, 226, 206) * (.93 + .1 * mott[..., None] + t[..., None])
base -= rgb(34, 30, 24) * (np.clip((veins - .5) * 3, 0, 1) ** 1.5)[..., None]
base = base * (1 - .35 * pore[..., None]) * (1 - .16 * grout[..., None])
save('travertine', base)
save('travertine_n', normal_map(veins * .3 - pore * 1.2 - grout * 2, 3.0))
save('travertine_r', np.repeat((60 + pore * 120 + grout * 120 + mott * 30)[..., None], 3, 2))

# ---- plaster: near-white lime finish with trowel marks
mott = noise(N, 2.2)
trowel = noise(N, 1.4, sx=1, sy=2)
base = rgb(244, 238, 228) * (.95 + .07 * mott[..., None])
save('plaster', base)
save('plaster_n', normal_map(trowel * .6 + noise(N, .9) * .25, 2.5))

# ---- oak: vertical grain for the fins and benches
g = noise(N, 2.0, sx=1, sy=10)
rings = (np.sin((np.linspace(0, 1, N)[None, :] * 18 + g * 2.2) * np.pi * 2) * .5 + .5) ** 3
fine = noise(N, 1.0, sx=1, sy=25)
wood = np.clip(.7 * rings + .5 * fine - .1, 0, 1)[..., None]
base = rgb(178, 128, 82) * (1 - wood) + rgb(112, 72, 42) * wood
save('oak', base * (.92 + .1 * noise(N, 2)[..., None]))
save('oak_n', normal_map(rings * .4 + fine * .6, 2.0))

# ---- paving: 4x4 sandstone pavers with speckle and worn grout
mott = noise(N, 2.0)
speck = np.clip((noise(N, .3) - .7) * 4, 0, 1)
grout = tile_lines(N, 4, 3)
t = slab_tint(N, 4, .06)
base = rgb(214, 196, 166) * (.9 + .14 * mott[..., None] + t[..., None])
base = base * (1 - .2 * speck[..., None]) * (1 - .24 * grout[..., None])
save('paving', base)
save('paving_n', normal_map(mott * .4 + speck * .5 - grout * 2.5, 2.0))

# ---- concrete for the tower slabs and portal
mott = noise(N, 2.1)
base = rgb(206, 200, 190) * (.88 + .16 * mott[..., None]) * (1 - .18 * np.clip((noise(N, .5) - .75) * 5, 0, 1))[..., None]
save('concrete', base)
save('concrete_n', normal_map(mott * .4 + noise(N, .7) * .35, 2.0))

# ---- palm bark: stacked leaf-scar rings
B = 512
y = np.linspace(0, 1, B)[:, None]
x = np.linspace(0, 1, B)[None, :]
scar = np.abs(((y * 14 + .08 * np.sin(x * np.pi * 2 * 6)) % 1) - .5) * 2
h = scar ** 3 * .8 + noise(B, 1.2) * .3
base = rgb(124, 100, 76) * (.7 + .4 * h[..., None])
save('bark', base)
save('bark_n', normal_map(h, 5.0))

# ---- palm frond (RGBA): central rachis with drooping leaflets, drawn along x
W, H = 1024, 256
yy, xx = np.mgrid[0:H, 0:W]
u = xx / W
v = (yy - H / 2) / (H / 2)
alpha = np.zeros((H, W))
col = np.zeros((H, W, 3))
k = np.arange(70)
for i in k:
    s = i / len(k)
    x0 = .04 + s * .93
    length = .95 * np.sin(np.pi * min(1, s * 1.15 + .05)) ** .6
    for side in (-1, 1):
        # leaflet: thin band from the rachis outward and back toward the tip
        d = (u - x0) * 3.2 - np.abs(v) * .55 * length * 1.0
        along = np.abs(v) / max(length, .05)
        band = (np.abs(d) < .018 * (1 - along) + .004) & (along < 1) & (np.sign(v) == side)
        alpha[band] = 1
        shade = .8 + .35 * (1 - along) + rng.uniform(-.08, .08)
        col[band] = np.array([62, 98, 40]) * shade[band][:, None]
rachis = np.abs(v) < .025 * (1 - u * .8)
alpha[rachis] = 1
col[rachis] = [118, 112, 62]
save('frond', np.dstack([col, alpha * 255]), q=88)

# ---- water ripples (normal only)
save('water_n', normal_map(noise(512, 2.6) * .7 + noise(512, 1.6) * .3, 6.0))
print('textures ->', OUT, sorted(os.listdir(OUT)))
