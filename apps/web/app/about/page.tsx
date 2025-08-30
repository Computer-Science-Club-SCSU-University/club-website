import { Navbar } from "@/components/layouts/Navbar";
import { Footer } from "@/components/layouts/Footer";
import { Card } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              About the Computer Science Club
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are St. Cloud State University's premier student computing community, 
              dedicated to fostering learning, collaboration, and innovation in computer science.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="pb-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To create an inclusive environment where students can explore computer science, 
                  develop technical skills, and build lasting connections with peers and industry professionals. 
                  We believe in learning through collaboration, experimentation, and real-world application.
                </p>
              </Card>
              
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">What We Do</h2>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Host technical workshops and coding sessions</li>
                  <li>• Organize networking events with industry professionals</li>
                  <li>• Run hackathons and programming competitions</li>
                  <li>• Provide mentorship and career guidance</li>
                  <li>• Foster a supportive learning community</li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Inclusivity</h3>
                <p className="text-muted-foreground text-sm">
                  We welcome students of all backgrounds and skill levels to join our community.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Innovation</h3>
                <p className="text-muted-foreground text-sm">
                  We encourage creative problem-solving and exploration of new technologies.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 6V8a2 2 0 00-2-2H10a2 2 0 00-2 2v8a2 2 0 002 2h4a2 2 0 002-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Growth</h3>
                <p className="text-muted-foreground text-sm">
                  We support continuous learning and professional development for all members.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Join Us */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Ready to Join?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Whether you're a beginner or an experienced programmer, there's a place for you in our community.
            </p>
            {/* CTA Buttons - Side by Side */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="px-8 py-6 text-lg">
              <a href="https://discord.gg/zeFSpn3VJ9" target="_blank" rel="noopener noreferrer">
                  Join Our Discord
                </a>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                <a href="/events">
                  View Upcoming Events 
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
} 