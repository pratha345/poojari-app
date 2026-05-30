const pool = require('../config/db');

const OVERPASS_HOSTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];

async function overpassQuery(query) {
  const body = `data=${encodeURIComponent(query)}`;
  for (const url of OVERPASS_HOSTS) {
    try {
      const res  = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':   'pojjari-hall-finder/1.0',
        },
        body,
        signal:  AbortSignal.timeout(20000),
      });
      const text = await res.text();
      if (!text.trimStart().startsWith('<')) return JSON.parse(text);
    } catch (e) { console.error('Overpass attempt failed:', url, e.message); }
  }
  throw new Error('All Overpass endpoints failed');
}

function haversine(lat1, lng1, lat2, lng2) {
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

exports.getHalls = async (req, res) => {
  try {
    const { city, district, taluka } = req.query;
    let query = 'SELECT * FROM halls';
    const params = [];
    const conditions = [];

    if (district && district.trim()) {
      conditions.push('district = ?');
      params.push(district.trim());
    }
    if (taluka && taluka.trim()) {
      conditions.push('taluka = ?');
      params.push(taluka.trim());
    }
    if (!district && !taluka && city && city.trim()) {
      conditions.push('city LIKE ?');
      params.push(`%${city.trim()}%`);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getHalls error:', err);
    res.status(500).json({ success: false, message: 'हॉल माहिती मिळवता आली नाही.' });
  }
};

exports.getPlacesNearbyHalls = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (isNaN(lat) || isNaN(lng))
      return res.status(400).json({ success: false, message: 'अवैध निर्देशांक दिले.' });

    const query = `[out:json][timeout:20];(node["amenity"="event_venue"](around:20000,${lat},${lng});way["amenity"="event_venue"](around:20000,${lat},${lng});node["building"="hall"](around:20000,${lat},${lng});way["building"="hall"](around:20000,${lat},${lng});node["name"~"mangal|banquet|wedding|hall|karyalay",i](around:20000,${lat},${lng});way["name"~"mangal|banquet|wedding|hall|karyalay",i](around:20000,${lat},${lng}););out center;`;

    const data = await overpassQuery(query);
    const elements = data.elements || [];

    const seen = new Set();
    const halls = elements
      .filter(el => el.tags && el.tags.name)
      .filter(el => { if (seen.has(el.tags.name)) return false; seen.add(el.tags.name); return true; })
      .map(el => {
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        return {
          id:            `osm-${el.type}-${el.id}`,
          name:          el.tags.name,
          address:       [el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', ') || el.tags['addr:full'] || '',
          city:          el.tags['addr:city'] || null,
          latitude:      elLat,
          longitude:     elLng,
          distance:      (elLat && elLng) ? haversine(lat, lng, elLat, elLng) : null,
          phone:         el.tags.phone || el.tags['contact:phone'] || null,
          whatsapp:      null,
          capacity:      el.tags.capacity ? parseInt(el.tags.capacity) : null,
          price_per_day: null,
          source:        'osm',
          maps_url:      `https://www.openstreetmap.org/${el.type}/${el.id}`,
        };
      })
      .filter(h => h.latitude && h.longitude)
      .sort((a, b) => (a.distance || 999) - (b.distance || 999));

    res.json({ success: true, data: halls });
  } catch (err) {
    console.error('getPlacesNearbyHalls error:', err);
    res.status(500).json({ success: false, message: 'जवळचे हॉल मिळवता आले नाहीत.' });
  }
};

exports.getNearbyHalls = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'अवैध निर्देशांक दिले.' });
    }

    const query = `
      SELECT *,
        ROUND(
          6371 * ACOS(
            COS(RADIANS(?)) * COS(RADIANS(latitude)) *
            COS(RADIANS(longitude) - RADIANS(?)) +
            SIN(RADIANS(?)) * SIN(RADIANS(latitude))
          ), 1
        ) AS distance
      FROM halls
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      HAVING distance < 40
      ORDER BY distance ASC
    `;
    const [rows] = await pool.query(query, [lat, lng, lat]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getNearbyHalls error:', err);
    res.status(500).json({ success: false, message: 'जवळचे हॉल मिळवता आले नाहीत.' });
  }
};

// ── Admin CRUD ─────────────────────────────────────────────────

exports.getAllHallsAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM halls ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAllHallsAdmin error:', err);
    res.status(500).json({ success: false, message: 'हॉल माहिती मिळवता आली नाही.' });
  }
};

exports.createHall = async (req, res) => {
  try {
    const { name, phone, whatsapp, district, taluka, city, address, capacity, price_per_day, latitude, longitude } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'नाव आणि फोन आवश्यक आहे.' });
    const [result] = await pool.query(
      'INSERT INTO halls (name, phone, whatsapp, district, taluka, city, address, capacity, price_per_day, latitude, longitude) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [name, phone, whatsapp || null, district || null, taluka || null, city || null, address || null, capacity || null, price_per_day || null, latitude || null, longitude || null]
    );
    res.json({ success: true, message: 'हॉल यशस्वीपणे जोडला.', id: result.insertId });
  } catch (err) {
    console.error('createHall error:', err);
    res.status(500).json({ success: false, message: 'हॉल जोडता आला नाही.' });
  }
};

exports.updateHall = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, whatsapp, district, taluka, city, address, capacity, price_per_day, latitude, longitude } = req.body;
    await pool.query(
      'UPDATE halls SET name=?, phone=?, whatsapp=?, district=?, taluka=?, city=?, address=?, capacity=?, price_per_day=?, latitude=?, longitude=? WHERE id=?',
      [name, phone, whatsapp || null, district || null, taluka || null, city || null, address || null, capacity || null, price_per_day || null, latitude || null, longitude || null, id]
    );
    res.json({ success: true, message: 'हॉल यशस्वीपणे अपडेट केला.' });
  } catch (err) {
    console.error('updateHall error:', err);
    res.status(500).json({ success: false, message: 'हॉल अपडेट करता आला नाही.' });
  }
};

exports.deleteHall = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM halls WHERE id=?', [id]);
    res.json({ success: true, message: 'हॉल यशस्वीपणे हटवला.' });
  } catch (err) {
    console.error('deleteHall error:', err);
    res.status(500).json({ success: false, message: 'हॉल हटवता आला नाही.' });
  }
};
