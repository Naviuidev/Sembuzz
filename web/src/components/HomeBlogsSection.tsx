import { Link } from 'react-router-dom';
import { HomeBlogsShowcase } from './HomeBlogsShowcase';

const BLOG_WORKFLOW = [
  { icon: 'bi-pencil-square', label: 'Subcategory admin', desc: 'Drafts blog posts' },
  { icon: 'bi-check2-circle', label: 'Category admin', desc: 'Reviews & approves' },
  { icon: 'bi-calendar-event', label: 'Schedule', desc: 'Optional publish time' },
  { icon: 'bi-globe2', label: 'Students', desc: 'Read on web & app' },
];

const BLOG_CAPABILITIES = [
  'Rich text blogs with images — separate from short-form feed news',
  'Same approval workflow as campus events with resubmit after corrections',
  'Public blog listing at /blogs plus in-app Blogs tab for verified students',
  'Category and school scoped — students see blogs relevant to their campus',
];

export function HomeBlogsSection() {
  return (
    <section id="campus-blogs" className="home-blogs-section">
      <div className="container py-4 py-lg-5">
        <div className="row align-items-center g-4 g-xl-5">
          <div className="col-lg-6 order-2 order-lg-1">
            <HomeBlogsShowcase />
          </div>

          <div className="col-lg-6 order-1 order-lg-2 home-blogs-copy">
            <p className="home-blogs-eyebrow mb-2">Campus Blogs</p>
            <h2 className="home-blogs-title">
              <span className="home-blogs-title-line">Long-form stories</span>
              <span className="home-blogs-title-line">beyond the scroll feed</span>
            </h2>
            <p className="home-blogs-subtitle">
              SemBuzz gives departments a dedicated blog channel — contributors submit,
              category admins approve, and students discover thoughtful campus writing on
              web and mobile.
            </p>

            <div className="home-blogs-workflow" aria-label="Blog publishing workflow">
              {BLOG_WORKFLOW.map((step, i) => (
                <div key={step.label} className="home-blogs-workflow-item">
                  <div className="home-blogs-workflow-step">
                    <i className={`bi ${step.icon}`} aria-hidden />
                    <div>
                      <strong>{step.label}</strong>
                      <span>{step.desc}</span>
                    </div>
                  </div>
                  {i < BLOG_WORKFLOW.length - 1 && (
                    <i className="bi bi-arrow-right home-blogs-workflow-arrow" aria-hidden />
                  )}
                </div>
              ))}
            </div>

            <ul className="home-blogs-list list-unstyled mb-4">
              {BLOG_CAPABILITIES.map((item) => (
                <li key={item}>
                  <i className="bi bi-check2" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/blogs" className="home-blogs-cta">
              Browse campus blogs
              <i className="bi bi-arrow-up-right" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
