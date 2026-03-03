import { Navbar } from '../components/Navbar';
import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

export const FAQs = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQ[] = [
    {
      question: 'What is SemBuzz?',
      answer: 'SemBuzz is a comprehensive school management system designed to streamline educational operations and enhance communication between schools, students, and parents.',
    },
    {
      question: 'How do I register my school?',
      answer: 'To register your school, please contact our support team or use the registration form. A Super Admin will review your application and set up your school account.',
    },
    {
      question: 'What features are available?',
      answer: 'SemBuzz offers various features including student management, attendance tracking, homework assignments, fee management, parent-teacher communication, and announcements.',
    },
    {
      question: 'Is SemBuzz free to use?',
      answer: 'SemBuzz offers different pricing plans based on your school\'s needs. Please contact us for more information about our pricing options.',
    },
    {
      question: 'How secure is my data?',
      answer: 'We take data security seriously. All data is encrypted and stored securely. We follow industry best practices to ensure your information is protected.',
    },
    {
      question: 'Can I access SemBuzz on mobile devices?',
      answer: 'Yes! SemBuzz is accessible on all devices including smartphones and tablets. We also have dedicated mobile apps for iOS and Android.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />
      
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <h1 className="text-center mb-5" style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700',
              color: '#1a1f2e'
            }}>
              Frequently Asked Questions
            </h1>
            
            <div className="accordion" id="faqAccordion">
              {faqs.map((faq, index) => (
                <div key={index} className="accordion-item mb-3" style={{ 
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <h2 className="accordion-header" id={`heading${index}`}>
                    <button
                      className={`accordion-button ${openIndex === index ? '' : 'collapsed'}`}
                      type="button"
                      onClick={() => toggleFAQ(index)}
                      style={{
                        backgroundColor: openIndex === index ? '#4dabf7' : '#fff',
                        color: openIndex === index ? '#fff' : '#1a1f2e',
                        fontWeight: '500',
                        border: 'none',
                        boxShadow: 'none'
                      }}
                    >
                      {faq.question}
                    </button>
                  </h2>
                  {openIndex === index && (
                    <div
                      className="accordion-collapse collapse show"
                      style={{
                        backgroundColor: '#fff',
                        padding: '1.5rem'
                      }}
                    >
                      <div className="accordion-body" style={{ color: '#6c757d' }}>
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
