"use client";

import { Navbar } from "@/components/layouts/Navbar";
import { Footer } from "@/components/layouts/Footer";
import { Button } from "@workspace/ui/components/button";
import { useOfficers } from "@/hooks/useOfficers";
import { OfficerCard, OfficerCardSkeleton } from "@workspace/ui/components";

export default function OfficersPage() {
  const { officers, loading, error } = useOfficers();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              Meet Our Officers
            </h1>
            <p className="text-lg text-muted-foreground">
              The dedicated team working to make the CS Club a thriving community for all students.
            </p>
          </div>
        </section>

        {/* Officers Grid */}
        <section className="pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <OfficerCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-2">Failed to load officers</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : officers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {officers.map((officer) => (
                  <OfficerCard 
                    key={officer.id} 
                    officer={{
                      ...officer,
                      position: officer.role,  // Map role to position for compatibility
                      image_url: officer.image, // Map image to image_url
                      linkedin_url: officer.linkedin // Map linkedin to linkedin_url
                    }}
                    variant="public"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No officers found.</p>
              </div>
            )}
          </div>
        </section>

        {/* Join Us */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Interested in Getting Involved?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We're always looking for passionate students to help organize events and build our community. 
              Elections are held each spring, but there are volunteer opportunities throughout the year.
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
                  Attend Our Events 
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