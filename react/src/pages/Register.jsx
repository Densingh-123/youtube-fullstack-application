import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const nameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== confirmPasswordRef.current.value) {
      return setError('Passwords do not match');
    }

    if (passwordRef.current.value.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      await register(emailRef.current.value, passwordRef.current.value, nameRef.current.value);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to create an account');
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: 24
    }}>
      <div style={{
        background: 'var(--yt-surface)', padding: 40, borderRadius: 12, width: '100%', maxWidth: 450,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)', border: '1px solid var(--yt-border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--yt-text)' }}>Create Account</h2>
          <p style={{ color: 'var(--yt-text-secondary)', marginTop: 8 }}>Register to get personalized recommendations</p>
        </div>

        {error && <div style={{ background: 'rgba(255,0,0,0.1)', color: 'var(--yt-red)', padding: 12, borderRadius: 8, marginBottom: 20, textAlign: 'center', fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <input
              type="text"
              ref={nameRef}
              required
              placeholder="Full Name"
              style={{
                width: '100%', padding: '14px 16px', background: 'var(--yt-bg)', border: '1px solid var(--yt-input-border)',
                borderRadius: 8, color: 'var(--yt-text)', fontSize: 16, outline: 'none'
              }}
            />
          </div>
          <div>
            <input
              type="email"
              ref={emailRef}
              required
              placeholder="Email address"
              style={{
                width: '100%', padding: '14px 16px', background: 'var(--yt-bg)', border: '1px solid var(--yt-input-border)',
                borderRadius: 8, color: 'var(--yt-text)', fontSize: 16, outline: 'none'
              }}
            />
          </div>
          <div>
            <input
              type="password"
              ref={passwordRef}
              required
              placeholder="Password"
              style={{
                width: '100%', padding: '14px 16px', background: 'var(--yt-bg)', border: '1px solid var(--yt-input-border)',
                borderRadius: 8, color: 'var(--yt-text)', fontSize: 16, outline: 'none'
              }}
            />
          </div>
          <div>
            <input
              type="password"
              ref={confirmPasswordRef}
              required
              placeholder="Confirm Password"
              style={{
                width: '100%', padding: '14px 16px', background: 'var(--yt-bg)', border: '1px solid var(--yt-input-border)',
                borderRadius: 8, color: 'var(--yt-text)', fontSize: 16, outline: 'none'
              }}
            />
          </div>
          <button disabled={loading} type="submit" style={{
            background: 'var(--yt-input-focus-border)', color: 'white', border: 'none', padding: 14,
            borderRadius: 24, fontSize: 16, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 8, transition: 'background 0.2s'
          }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 14 }}>
          <span style={{ color: 'var(--yt-text-secondary)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--yt-input-focus-border)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
