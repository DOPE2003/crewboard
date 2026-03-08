import db from "@/lib/db";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="page">
      <section className="talent-wrap">
        <div className="talent-header">
          <div className="auth-kicker">— CREWBOARD</div>
          <h1 className="auth-title">Projects</h1>
          <p className="auth-sub">Open Web3 projects looking for crew.</p>
        </div>

        {projects.length === 0 ? (
          <div className="talent-empty">
            <p>No open projects yet — check back soon.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project: typeof projects[number]) => (
              <div key={project.id} className="project-card">
                <div className="project-card-top">
                  <h2 className="project-title">{project.title}</h2>
                  <span className="project-status-badge">{project.status}</span>
                </div>

                {project.description && (
                  <p className="project-desc">{project.description}</p>
                )}

                {project.stack.length > 0 && (
                  <div className="project-chips-row">
                    <div className="dash-section-label" style={{ marginBottom: 6 }}>Stack</div>
                    <div className="project-chips">
                      {project.stack.map((s: string) => (
                        <span key={s} className="dash-skill-chip">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {project.rolesNeeded.length > 0 && (
                  <div className="project-chips-row">
                    <div className="dash-section-label" style={{ marginBottom: 6 }}>Roles Needed</div>
                    <div className="project-chips">
                      {project.rolesNeeded.map((r: string) => (
                        <span key={r} className="talent-role">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
