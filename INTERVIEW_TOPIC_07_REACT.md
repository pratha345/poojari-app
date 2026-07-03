# Topic 07: React.js
> Component-based UI library — Pojjari frontend with hooks, context, and React Router

---

## 7.1 Virtual DOM — How React is Fast

### Problem with direct DOM manipulation
```js
// Direct DOM is slow because of reflow/repaint
document.getElementById('count').textContent = newCount;
// Browser must: parse, build CSSOM, calculate layout, repaint
```

### React's Solution: Virtual DOM
```
State changes
     ↓
React builds new Virtual DOM (plain JS object — fast)
     ↓
Diffing Algorithm (Reconciliation):
  Compare new Virtual DOM vs previous Virtual DOM
  Find ONLY what changed (the "diff")
     ↓
Patch: Apply ONLY the diff to the real DOM
  → Minimal DOM operations → Fast UI updates
```

```js
// Virtual DOM is just a JS object
{
  type: 'div',
  props: { className: 'booking-card' },
  children: [
    { type: 'h2', props: {}, children: ['Ganesh Puja'] },
    { type: 'p', props: {}, children: ['Jan 15, 2024'] }
  ]
}
```

**React Fiber** (React 16+): Reconciliation can be paused, split into chunks — smoother animations, no jank.

---

## 7.2 Hooks — useState and useEffect

### useState — Local State
```jsx
import { useState } from 'react';

function BookingForm() {
  const [pujariId, setPujariId] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pujariId, date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-red-500">{error}</p>}
      <button disabled={loading}>{loading ? 'Booking...' : 'Book Now'}</button>
    </form>
  );
}
```

### useEffect — Side Effects + Data Fetching
```jsx
import { useEffect, useState } from 'react';

function PujariList() {
  const [pujaris, setPujaris] = useState([]);

  // [] = runs ONCE after component mounts (like componentDidMount)
  useEffect(() => {
    fetchPujaris();
  }, []);

  // [categoryId] = runs when categoryId changes
  useEffect(() => {
    fetchPujarisByCategory(categoryId);
  }, [categoryId]);

  // No [] = runs after EVERY render (usually not what you want)
  useEffect(() => {
    document.title = `Pojjari — ${pujaris.length} Pujaris`;
  });

  // Cleanup function — runs before unmount or before next effect
  useEffect(() => {
    const timer = setInterval(fetchUpdates, 30000);
    return () => clearInterval(timer);  // cleanup!
  }, []);
}
```

---

## 7.3 useCallback and useMemo — Performance

### useMemo — Cache Expensive Calculations
```jsx
import { useMemo } from 'react';

function PujariDirectory({ pujaris, searchTerm, category }) {
  // Without useMemo: filters on every render (even unrelated state changes)
  // With useMemo: only re-filters when pujaris, searchTerm, or category change
  const filteredPujaris = useMemo(() => {
    return pujaris
      .filter(p => p.category === category || !category)
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.rating - a.rating);
  }, [pujaris, searchTerm, category]);

  return <div>{filteredPujaris.map(p => <PujariCard key={p.id} pujari={p} />)}</div>;
}
```

### useCallback — Stable Function References
```jsx
import { useCallback } from 'react';

function BookingManager({ userId }) {
  // Without useCallback: new function on every render → child re-renders
  // With useCallback: same function reference unless userId changes
  const handleCancel = useCallback(async (bookingId) => {
    await fetch(`/api/booking/${bookingId}`, { method: 'DELETE' });
    refreshBookings();
  }, [userId]); // only recreate when userId changes

  return <BookingList onCancel={handleCancel} />;
}
```

**When to use:**
- `useMemo`: Expensive computation (sorting, filtering large arrays)
- `useCallback`: Function passed as prop to memoized child component

---

## 7.4 useRef — Direct DOM Access + Persist Values

```jsx
import { useRef } from 'react';

function SearchBox() {
  const inputRef = useRef(null);

  function focusSearch() {
    inputRef.current.focus(); // direct DOM access
  }

  // useRef persists value across renders WITHOUT causing re-render
  const renderCount = useRef(0);
  renderCount.current++;  // doesn't trigger re-render
  // useState would trigger re-render

  return <input ref={inputRef} type="text" placeholder="Search pujaris..." />;
}
```

**useState vs useRef:**
- `useState`: Changing value → triggers re-render
- `useRef`: Changing value → NO re-render (useful for timers, previous values, DOM refs)

---

## 7.5 Context API — Global State (No Prop Drilling)

```jsx
// context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  function login(userData, jwt) {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('token', jwt);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Any component can use auth without prop drilling:
function Navbar() {
  const { user, logout } = useAuth();
  return <button onClick={logout}>Logout {user?.name}</button>;
}
```

---

## 7.6 React Router v6 — Navigation

```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/pujaris"       element={<PujariList />} />
        <Route path="/pujaris/:id"   element={<PujariDetail />} />
        <Route path="/booking"       element={
          <PrivateRoute>           {/* protected route */}
            <BookingForm />
          </PrivateRoute>
        } />
        <Route path="/admin/*"       element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="*"             element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

// Protected route pattern
function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}
```

```jsx
// Navigation
import { useNavigate, useParams, Link } from 'react-router-dom';

function PujariDetail() {
  const { id } = useParams();           // /pujaris/42 → id = "42"
  const navigate = useNavigate();

  function goBack() {
    navigate(-1);                        // browser back
    navigate('/pujaris');               // go to route
    navigate('/booking', { state: { pujariId: id } }); // pass state
  }

  return <Link to={`/booking?pujariId=${id}`}>Book Now</Link>;
}
```

---

## 7.7 Common Patterns in Pojjari Frontend

### API Call Pattern
```jsx
function usePujaris() {
  const [pujaris, setPujaris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/pujari', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setPujaris(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  return { pujaris, loading, error };
}
```

### Conditional Rendering
```jsx
function BookingCard({ booking }) {
  return (
    <div>
      {/* Logical AND — show if true */}
      {booking.isPending && <span className="badge">Pending</span>}

      {/* Ternary — show A or B */}
      {booking.status === 'confirmed'
        ? <span className="text-green-500">Confirmed</span>
        : <span className="text-yellow-500">Pending</span>
      }

      {/* Nullish coalescing */}
      <p>{booking.notes ?? 'No special notes'}</p>
    </div>
  );
}
```

---

## Interview Q&A

**Q: Virtual DOM म्हणजे काय? कसं efficient आहे?**
> Virtual DOM म्हणजे real DOM चं lightweight JS object representation. State change झाल्यावर React नवीन Virtual DOM बनवतो, previous शी compare करतो (diffing), फक्त changed parts real DOM मध्ये update करतो. Real DOM manipulation expensive आहे (reflow/repaint triggers), Virtual DOM मध्ये हे minimized होतं.

**Q: useEffect dependency array — `[]` vs `[value]` vs nothing**
> `[]` = empty — component mount झाल्यावर एकदाच run (componentDidMount equivalent).
> `[value]` = value change झाल्यावर run.
> No array = प्रत्येक render नंतर run (usually infinite loop risk).
> Cleanup function return करतो — unmount वर किंवा पुढचा effect run होण्याआधी call होतो.

**Q: useState vs useRef**
> useState: value change → component re-render → UI update.
> useRef: value change → NO re-render. DOM elements reference साठी (`ref={inputRef}`), render count track करण्यासाठी, timer IDs store करण्यासाठी.

**Q: useMemo vs useCallback**
> useMemo: expensive value cache करतो (filtered array, calculation). Returns a memoized value.
> useCallback: function reference memoize करतो. Returns a memoized function. Child component ला prop म्हणून function पाठवत असाल तर useCallback वापरतो — otherwise child प्रत्येक render ला unnecessary re-render होतो.

**Q: Context API vs Props Drilling vs Redux**
> Props Drilling: A → B → C → D — C ला data नको पण pass करावं लागतं. Messy.
> Context: Global state — any component access करू शकतो. Pojjari मध्ये auth state (user, token, login, logout) Context मध्ये.
> Redux: Complex state logic, many actions, time-travel debugging. Pojjari साठी Context enough आहे.

**Q: React Router PrivateRoute pattern**
> Component wrap करतो. Token आहे का check करतो — नसेल तर `<Navigate to="/login">`. आहे तर `children` render करतो. Route ला directly `element={<PrivateRoute><Dashboard /></PrivateRoute>}` लिहितो.

---

## Pojjari Project Connection

| Feature | React Concept |
|---------|--------------|
| Booking form | `useState` for form fields, loading, error |
| Pujari list loading | `useEffect([], fetchPujaris)` |
| Pujari search + filter | `useMemo` for filtered results |
| Auth state (user, token) | Context API + `localStorage` |
| Protected routes | `PrivateRoute` + React Router |
| Admin only routes | `AdminRoute` (checks role) |
| Panchang page | `useEffect` with date dependency |
| Cancel booking | `useCallback` for stable handler |

---

## Summary Table

| Concept | Key Point |
|---------|-----------|
| Virtual DOM | JS object representation, diffing = minimal DOM updates |
| `useState` | Local state, triggers re-render on change |
| `useEffect` | Side effects, fetch data, subscriptions |
| `useEffect []` | Runs once on mount |
| `useRef` | DOM ref or persist value without re-render |
| `useMemo` | Cache expensive computation |
| `useCallback` | Cache function reference |
| Context API | Global state — avoids prop drilling |
| React Router | `BrowserRouter`, `Routes`, `Route`, `useParams`, `useNavigate` |
| PrivateRoute | Redirect to login if no token |
