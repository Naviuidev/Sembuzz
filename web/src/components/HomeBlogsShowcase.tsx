const BLOG_POSTS = [
  {
    category: 'Research',
    title: 'How our lab is using AI for climate modeling',
    excerpt: 'A behind-the-scenes look at student-led research this semester…',
    author: 'Dr. Chen · Physics Dept',
    date: 'Mar 12',
  },
  {
    category: 'Student Life',
    title: 'Five clubs to join during your first month',
    excerpt: 'From robotics to creative writing — find your community early…',
    author: 'Campus Life · Approved',
    date: 'Mar 8',
  },
];

export function HomeBlogsShowcase() {
  return (
    <div className="home-blogs-showcase">
      <div className="home-blogs-showcase-layer home-blogs-showcase-portal">
        <img
          src="/hero/subcategory-admin.png"
          alt="Subcategory admin submitting a blog for approval"
          className="home-blogs-showcase-img"
        />
      </div>

      <div className="home-blogs-showcase-layer home-blogs-showcase-feed">
        <div className="home-blogs-feed-mock">
          <div className="home-blogs-feed-header">
            <strong>Campus Blogs</strong>
            <span>/blogs</span>
          </div>
          {BLOG_POSTS.map((post) => (
            <article key={post.title} className="home-blogs-feed-card">
              <span className="home-blogs-feed-category">{post.category}</span>
              <h4>{post.title}</h4>
              <p>{post.excerpt}</p>
              <div className="home-blogs-feed-meta">
                <span>{post.author}</span>
                <span>{post.date}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
