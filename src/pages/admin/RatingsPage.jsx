import { useState, useEffect } from 'react';
import { ratings } from '../../services/api';
import RatingStars from '../../components/network/RatingStars';

export default function RatingsPage() {
  const [summary, setSummary] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([ratings.summary(), ratings.list()]);
      setSummary(s);
      setList(l.ratings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ratings & Reputation</h1>
      {loading ? <p>Loading...</p> : (
        <>
          {summary && (
            <div className="grid sm:grid-cols-3 gap-4">
              <Card title="Given (Business)" data={summary.givenBusiness} />
              <Card title="Received (Business)" data={summary.receivedBusiness} />
              <Card title="Received (Rider)" data={summary.receivedRider} />
            </div>
          )}
          <div className="space-y-3">
            {list.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                <RatingStars rating={r.rating} readOnly />
                <span className="text-sm text-gray-600">{r.type}</span>
                <span className="text-xs text-gray-500 ml-auto">{r.createdAt}</span>
                {r.review && <p className="text-sm text-gray-700 mt-1">{r.review}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, data }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="text-2xl font-bold">{data?.average?.toFixed(1) || '0.0'}</div>
      <p className="text-xs text-gray-500">{data?.count || 0} ratings</p>
    </div>
  );
}
