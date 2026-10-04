import mentorArIcon from "../assets/mentorar-icon.png";
import mentorArWordmark from "../assets/mentorar.png";

export function AuthLayout({ children }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <aside className="auth-brand-panel">
          <img className="auth-brand-icon" src={mentorArIcon} alt="" />
          <div className="auth-brand-content">
            <img className="auth-brand-wordmark" src={mentorArWordmark} alt="MentorAr" />
            <p>Conectamos alumnos con profesores cerca tuyo, para aprender a tu ritmo.</p>
          </div>
          <div className="auth-brand-decoration" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </aside>
        <section className="auth-form-panel">{children}</section>
      </div>
    </main>
  );
}
