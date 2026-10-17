import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, Github, Mail } from "lucide-react";
import Logo from "@/assets/techverse-logo.jpg";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { cloudinary } from "@/hooks/cloudinary";
import { getLeaders, getAboutUs, getMentors } from "@/services/api";


// ✅ Re-usable Card Component with responsive sizing
const MemberCard = ({ member, index, isFlipped, socialIcons = false, handleMouseEnter, handleMouseLeave }: any) => {
  // Height increased for better image display on mobile
  const heightClass = socialIcons ? 'h-60 md:h-80' : 'h-48 md:h-72'; 

  return (
    <div
      key={member._id || index}
      className={`relative w-40 md:w-64 ${heightClass} [perspective:1000px]`}
      onMouseEnter={() => handleMouseEnter(index)}
      onMouseLeave={() => handleMouseLeave(index)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-[8000ms] ease-[cubic-bezier(0.45,0.05,0.55,0.95)] [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(0deg)]" : ""
        }`}
      >
        {/* Front Side */}
        <Card className="absolute inset-0 flex flex-col justify-center items-center p-3 md:p-6 border border-blue-200 shadow-lg rounded-xl bg-white [backface-visibility:hidden] transition-transform duration-500 hover:scale-105 hover:shadow-blue-200/70">
          
          {/* ✅ aspect-square forces a 1:1 ratio, fixing image distortion */}
          <div className="relative w-16 md:w-24 aspect-square mb-2 md:mb-4 rounded-full overflow-hidden border-4 border-blue-500 shadow-md">
            <LazyLoadImage
             src={cloudinary(member.img_url ,200)||"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png"}
            srcSet={`
              ${cloudinary(member.img_url, 100)} 100w,
               ${cloudinary(member.img_url, 200)} 200w,
              ${cloudinary(member.img_url, 300)} 300w
            `}
            sizes="(max-width: 768px) 100px, 150px"
            placeholderSrc={cloudinary(member.img_url, 20)||"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png"}
            effect="blur"
            wrapperClassName="absolute inset-0"
            alt={member.Name}
            className="w-full h-full object-cover object-center"
            />
          </div>
          <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-1 text-center leading-tight">
            {member.Name}
          </h3>
          <p className="text-blue-600 font-semibold text-xs md:text-sm text-center mb-2 md:mb-3">
            {member.Designation}
          </p>

          {socialIcons && (
            <div className="flex gap-3 mt-1 md:mt-2 gap-x-4 md:gap-x-8">
              <a
                href={member.linkedin || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-md border ${
                  member.linkedin
                    ? "border-blue-500 text-blue-600 hover:bg-blue-100"
                    : "border-gray-300 text-gray-400 cursor-not-allowed"
                } transition duration-200`}
              >
                <Linkedin size={16} />
              </a>
              <a
                href={`mailto:${member.mail || "#"}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-md border ${
                  member.mail
                    ? "border-blue-500 text-blue-600 hover:bg-blue-100"
                    : "border-gray-300 text-gray-400 cursor-not-allowed"
                } transition duration-200`}
              >
                <Mail size={16} />
              </a>
            </div>
          )}
        </Card>

        {/* Back Side */}
        <Card className="absolute inset-0 p-3 md:p-6 flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-indigo-500 text-white border-none rounded-xl [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <p className="text-xs md:text-sm leading-relaxed px-1 md:px-2 mb-2 md:mb-4 text-center">
            {member.Description || member.description}
          </p>
          <span className="text-xs opacity-80">
            Hover away to flip back ↩️
          </span>
        </Card>
      </div>
    </div>
  );
};


const AboutUs = ({ onLoadComplete }: { onLoadComplete: () => void }) => {
  const [aboutUs, setAboutUs] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const hoverTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const [leaders, setLeaders] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
const HeroUrl=cloudinary(
  "https://res.cloudinary.com/diijn4esl/image/upload/v1761720223/grp_photo_fvzjjq.jpg",1600);
const HeroUrlMobile = cloudinary(
    "https://res.cloudinary.com/diijn4esl/image/upload/v1761720223/grp_photo_fvzjjq.jpg",800);
  
useEffect(() => {
  Promise.all([
    getLeaders(),
    getAboutUs(),
    getMentors(),
  ])
    .then(([leadersData, aboutUsData, mentorsData]) => {
      setLeaders(Array.isArray(leadersData) ? leadersData : [leadersData]);
      setAboutUs(Array.isArray(aboutUsData) ? aboutUsData : [aboutUsData]);
      setMentors(Array.isArray(mentorsData) ? mentorsData : [mentorsData]);
      setDataLoaded(true);
    })
    .catch((err) => console.error("Error fetching data:", err));
}, []);

// useEffect(() => {
//   const img = new Image();
//   img.src = HeroUrl;
//   img.onload = () => setHeroLoaded(true);
// }, []);
<link
  rel="preload"
  as="image"
  href={HeroUrl}
/>


useEffect(() => {
  if (dataLoaded && heroLoaded) {
    onLoadComplete();
  }
}, [dataLoaded, heroLoaded]);


  const handleMouseEnter = (index: number) => {
    const timer = setTimeout(() => {
      setFlippedIndex(index);
    }, 1800);
    hoverTimers.current.set(index, timer);
  };

  const handleMouseLeave = (index: number) => {
    const timer = hoverTimers.current.get(index);
    if (timer) clearTimeout(timer);
    hoverTimers.current.delete(index);
    setFlippedIndex(null);
  };

  return (
    <div className="min-h-screen pt-20 bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-48 md:py-72 text-white overflow-hidden">
      <div
  className="absolute inset-0 bg-cover bg-center brightness-80"
  style={{
    backgroundImage: `url(${
      window.innerWidth < 768 ? HeroUrlMobile : HeroUrl
    })`,
  }}
></div>

      </section>

      {/* TechVerse Club Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-800">
            About TechVerse Club
          </h2>
        </div>

        <div className="container mx-auto px-4 md:px-7 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[1.5px] border-blue-500/70 shadow-[0_6px_20px_rgba(0,0,0,0.15)]"></div>
            <LazyLoadImage
              src={Logo}
              alt="TechVerse Club Logo"
              className="w-full h-full object-cover rounded-full relative z-10 border border-blue-400 shadow-lg"
            />
          </div>
          <div className="md:w-2/3 text-center md:text-left -mt-4">
            <p className="text-lg text-gray-600 leading-relaxed text-justify">
              TechVerse Club of CT University, under the School of Engineering
              and Technology, is a dynamic community of innovators, developers,
              and tech enthusiasts driven by a shared passion for technology and
              creativity. Guided by the visionary leadership of Prof. Dr. Arvind
              Kumar (Head of School), with valuable guidance from Dr. Rajeev Sharma(Head of Department), coordinated by Ms. Mandeep Kaur, and
              supported by Dr. Harinder Pal Singh (Director – IT), the club
              serves as a vibrant platform for students to explore emerging
              technologies, enhance practical skills, and collaborate on
              real-world projects. At TechVerse, we bridge the gap between
              classroom learning and industry innovation, empowering students to
              transform ideas into impactful solutions that shape the
              future of technology.
            </p>
          </div>
        </div>
      </section>

      {/* Honorable Authorities Section */}
      <section className="py-10 -mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Honorable Authorities
            </h2>
          </div>

          <div className="flex flex-col items-center gap-14">
            {/* ✅ FIX: grid-cols-2 for mobile, lg:grid-cols-3 for desktop */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 md:gap-12 lg:gap-x-40 justify-items-center">
              {aboutUs.slice(0, 3).map((member, index) => (
                  // ✅ FIX: Logic to center the 3rd card on mobile (lg:col-span-1 resets it for desktop)
                  <div key={member._id || index} className={index === 2 ? 'col-span-2 lg:col-span-1 flex justify-center' : 'flex justify-center'}>
                    <MemberCard
                      member={member}
                      index={index}
                      isFlipped={flippedIndex === index}
                      handleMouseEnter={handleMouseEnter}
                      handleMouseLeave={handleMouseLeave}
                    />
                  </div>
              ))}
            </div>

            {/* ✅ FIX: grid-cols-2 for mobile, lg:grid-cols-5 for desktop */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-12 lg:gap-x-16 justify-items-center ">
              {aboutUs.slice(3).map((member, index) => {
                const actualIndex = index + 3;
                const sliceLength = aboutUs.slice(3).length;
                // Check if this is the last item AND if the total number of items in this slice is odd
                const isLastItemAndOdd = (index === sliceLength - 1) && (sliceLength % 2 !== 0);
                
                return (
                  // ✅ FIX: Logic to center the last card on mobile if count is odd (md: and lg: reset it for desktop)
                  <div key={member._id || actualIndex} className={isLastItemAndOdd ? 'col-span-2 md:col-span-1 lg:col-span-1 flex justify-center' : 'flex justify-center'}>
                    <MemberCard
                      member={member}
                      index={actualIndex}
                      isFlipped={flippedIndex === actualIndex}
                      handleMouseEnter={handleMouseEnter}
                      handleMouseLeave={handleMouseLeave}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Mentors Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Mentors(SOET)
          </h2>
        </div>
        <div className="flex flex-col items-center gap-14">
          {/* ✅ FIX: grid-cols-2 for mobile, lg:grid-cols-3 for desktop */}
            <div className="flex justify-center items-center gap-12 flex-wrap">
            {mentors.map((member, index) => {
              const sliceLength = mentors.length;
              const isLastItemAndOdd = (index === sliceLength - 1) && (sliceLength % 2 !== 0);
              
              return (
                // ✅ FIX: Logic to center the last card on mobile if count is odd
                <div key={member._id || index} className={isLastItemAndOdd ? 'col-span-2 md:col-span-1 lg:col-span-1 flex justify-center' : 'flex justify-center'}>
                  <MemberCard
                    member={member}
                    index={index + 100}
                    isFlipped={flippedIndex === index + 100}
                    handleMouseEnter={handleMouseEnter}
                    handleMouseLeave={handleMouseLeave}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leaders Section (remains grid-cols-2) */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 -mt-12">
            TechVerse Leaders
          </h2>
        </div>

        <div className="flex flex-col items-center gap-14">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 md:gap-12 lg:gap-x-28 justify-items-center">
            {leaders.slice(0, 6).map((member, index) => (
              <MemberCard
                key={member._id || index}
                member={member}
                index={index + 200}
                isFlipped={flippedIndex === index + 200}
                socialIcons={true}
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
              />
            ))}
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight -mb-12 mt-10 text-center">
            Event Management Team
          </h2>

          <div className="flex justify-center mt-16">
            {leaders.slice(6, 7).map((member, index) => (
              <MemberCard
                key={member._id || index}
                member={member}
                index={index + 300}
                isFlipped={flippedIndex === index + 300}
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
              />
            ))}
          </div>

          {/* CONNECTOR SECTION */}
          <div className="relative w-full flex justify-center items-center -mt-10">
            <div
              className="absolute top-[40%] left-1/2 -translate-x-1/2 
                w-full max-w-sm md:max-w-[70%] h-[160px] 
                bg-gradient-to-b from-blue-200/50 to-transparent 
                rounded-full blur-3xl"
            ></div>
            <svg
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[160px] pointer-events-none"
              viewBox="0 0 800 200"
              preserveAspectRatio="xMidYMin meet"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M400 0 L400 80"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M50 80 L750 80"
                className="hidden md:block"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M200 80 L600 80"
                className="block md:hidden"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path d="M150 80 L150 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M316 80 L316 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M484 80 L484 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M650 80 L650 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M200 80 L200 100" className="block md:hidden" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M600 80 L600 100" className="block md:hidden" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          <div className="container mx-auto px-4 mt-8 md:mt-12">
            <div className="grid grid-cols-2 gap-4 md:flex md:justify-center md:gap-12 lg:gap-x-12 justify-items-center md:flex-nowrap">
              {leaders.slice(7, 11).map((member, index) => {
                const lift =
                  index === 0 || index === 3
                    ? "md:-translate-y-32"
                    : index === 1 || index === 2
                    ? "md:-translate-y-4"
                    : "";

                return (
                  <div key={member._id || index} className={`transition-transform duration-700 ${lift}`}>
                    <MemberCard
                      member={member}
                      index={index + 400}
                      isFlipped={flippedIndex === index + 400}
                      cardHeight="h-40 md:h-52"
                      handleMouseEnter={handleMouseEnter}
                      handleMouseLeave={handleMouseLeave}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight -mb-12 mt-10">
            Tech Team
          </h2>
          {/* ===== ROW 5 + CONNECTOR + ROW 6 ===== */}
          <div className="relative flex flex-col items-center mt-24">
            {/* Row 5 — Single Centered Card */}
            <div className="flex justify-center relative z-10 -translate-y-8">
              {leaders.slice(11, 12).map((member, index) => (
                <MemberCard
                  key={member._id || index}
                  member={member}
                  index={index + 500}
                  isFlipped={flippedIndex === index + 500}
                  handleMouseEnter={handleMouseEnter}
                  handleMouseLeave={handleMouseLeave}
                />
              ))}
            </div>

            {/* CONNECTOR SECTION */}
            <div className="relative w-full flex justify-center items-center">
              <div
                className="absolute top-[40%] left-1/2 -translate-x-1/2 
                w-full max-w-sm md:max-w-[70%] h-[160px] 
                bg-gradient-to-b from-blue-200/50 to-transparent 
                rounded-full blur-3xl"
              ></div>
              <svg
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[160px] pointer-events-none"
              viewBox="0 0 800 200"
              preserveAspectRatio="xMidYMin meet"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M400 0 L400 80" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M50 80 L750 80" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M200 80 L600 80" className="block md:hidden" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M150 80 L150 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M316 80 L316 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M484 80 L484 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M650 80 L650 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M200 80 L200 100" className="block md:hidden" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M600 80 L600 100" className="block md:hidden" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
            </svg>
            </div>

            <div className="container mx-auto px-4 mt-16 md:mt-32">
              <div className="grid grid-cols-2 gap-4 md:flex md:justify-center md:gap-12 justify-items-center md:flex-nowrap">
                {leaders.slice(12, 16).map((member, index) => {
                  const lift =
                    index === 0 || index === 3
                      ? "md:-translate-y-40"
                      : index === 1 || index === 2
                      ? "md:-translate-y-7"
                      : "";
                  return (
                    <div key={member._id || index} className={`transition-transform duration-700 ${lift}`}>
                      <MemberCard
                        member={member}
                        index={index + 600}
                        isFlipped={flippedIndex === index + 600}
                        cardHeight="h-40 md:h-52"
                        handleMouseEnter={handleMouseEnter}
                        handleMouseLeave={handleMouseLeave}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight -mb-12 mt-10">
            Media Team
          </h2>
          {/* Row 7 — Single Centered Card */}
          <div className="flex justify-center mt-24 relative z-10">
            {leaders.slice(16, 17).map((member, index) => (
              <MemberCard
                key={member._id || index}
                member={member}
                index={index + 700}
                isFlipped={flippedIndex === index + 700}
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
              />
            ))}
          </div>

          {/* Connector between center and 4 below */}
          <div className="relative w-full flex justify-center items-center -mt-4">
            <svg
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[160px] pointer-events-none"
              viewBox="0 0 800 200"
              preserveAspectRatio="xMidYMin meet"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M400 0 L400 80" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M50 80 L750 80" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M200 80 L600 80" className="block md:hidden" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M150 80 L150 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M316 80 L316 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M484 80 L484 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M650 80 L650 100" className="hidden md:block" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M200 80 L200 100" className="block md:hidden" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <path d="M600 80 L600 100" className="block md:hidden" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          {/* Row 8 — Four Cards */}
          <div className="container mx-auto px-4 mt-8 md:mt-12">
            <div className="grid grid-cols-2 gap-4 md:flex md:justify-center md:gap-12 justify-items-center md:flex-nowrap">
              {leaders.slice(17, 21).map((member, index) => {
                const lift =
                  index === 0 || index === 3
                    ? "md:-translate-y-32"
                    : index === 1 || index === 2
                    ? "md:-translate-y-4"
                    : "";

                return (
                  <div key={member._id || index} className={`transition-transform duration-700 ${lift}`}>
                    <MemberCard
                      member={member}
                      index={index + 800}
                      isFlipped={flippedIndex === index + 800}
                      cardHeight="h-40 md:h-52"
                      handleMouseEnter={handleMouseEnter}
                      handleMouseLeave={handleMouseLeave}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Row — Leader connected to Worker */}
          <div className="relative flex flex-col justify-center items-center mt-24 gap-4">
            {leaders.slice(21, 22).map((member, index) => (
              <MemberCard
                key={member._id || index}
                member={member}
                index={index + 1100}
                isFlipped={flippedIndex === index + 1100}
                cardHeight="h-44 md:h-56"
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
              />
            ))}

            <svg
              className="block w-1 h-12"
              viewBox="0 0 4 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 0 L2 48"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>

            {leaders.slice(22, 23).map((member, index) => (
              <MemberCard
                key={member._id || index}
                member={member}
                index={index + 1200}
                isFlipped={flippedIndex === index + 1200}
                cardHeight="h-44 md:h-56"
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-500 to-cyan-400 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Want to Join Our Team?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            We're always looking for passionate individuals to help organize
            future events.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 hover:scale-105 transition-transform"
          >
            Get in Touch
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
