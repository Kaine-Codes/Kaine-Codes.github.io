import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Github, Linkedin, ExternalLink, Cpu, Code2, Rocket, DraftingCompass, Database, Layers, Radio, CircuitBoard, Mail, Phone, MapPin, Zap, Monitor } from 'lucide-react';

// --- Types ---
type AppState = 'loading' | 'terminal' | 'portfolio';

// --- Intro Components ---

const LoadingScreen = ({ onComplete }: { onComplete: () => void; key?: string }) => {
  const [percent, setPercent] = useState(0);
  const [isShattering, setIsShattering] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsShattering(true), 150);
          setTimeout(onComplete, 600);
          return 100;
        }
        return prev + 2.5;
      });
    }, 15);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#594433] overflow-hidden"
      exit={{ opacity: 0 }}
    >
      {/* Dirt Texture Loading Background */}
      <div className="absolute inset-0 opacity-50 " style={{
        backgroundImage: 'url("minecraft_loading_screen_bg_dirt.jpg")',
        backgroundSize: '256px 256px'
      }} />
   
      <motion.div 
        className="z-10 flex flex-col items-center"
        animate={isShattering ? { 
          y: [0, 20, 800], 
          rotate: [0, 5, 20],
          opacity: [1, 1, 0]
        } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeIn" }}
      >
        <h1 className="text-white font-pixel text-2xl tracking-[0.2em] mb-12 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
          {percent === 100 ? 'DONE!' : 'LOADING PORTFOLIO'}
        </h1>

        <div className="relative w-64 h-64 bg-black/40 backdrop-blur-xl border-8 border-[#3d2b1f] shadow-2xl flex items-center justify-center overflow-hidden">
          <motion.div 
            className="absolute inset-0 border-[12px] border-[#10b981]" 
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: `inset(${100 - percent}% 0 0 0)` }}
            transition={{ ease: "linear" }}
          />
          <div className="text-white font-pixel text-3xl font-black drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] z-20">
            {percent}%
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TerminalScreen = ({ onComplete }: { onComplete: () => void; key?: string }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isGlitching, setIsGlitching] = useState(true);

  const terminalLines = [
    "> INITIALIZING ECE_PORTFOLIO_V2...",
    "> LOADING CIRCUIT_SCHEMATICS [OK]",
    "> VERIFYING SIGNAL_INTEGRITY [98.2%]",
    "> SYNCHRONIZING HARDWARE_STACK...",
    "> EXECUTING MAIN_BOOT_SEQUENCE...",
    "> FETCHING SHINE_DANIEL.EXE...",

  ];

  useEffect(() => {
    const glitchTimeout = setTimeout(() => setIsGlitching(false), 200);
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < terminalLines.length) {
        setLines((prev) => [...prev, terminalLines[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1000);
      }
    }, 250);

    return () => {
      clearTimeout(glitchTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex flex-col bg-black p-12 font-mono overflow-hidden ${isGlitching ? 'animate-glitch' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#ba1a1a]" />
            <div className="w-3 h-3 rounded-full bg-[#e7c365]" />
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
          </div>
          <span className="text-emerald-500/30 text-[10px] tracking-widest uppercase font-bold">ECE_CORE // V2.0 </span>
        </div>

        <div className="space-y-4 text-emerald-400">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-start gap-8"
            >
              <span className="opacity-20 text-[11px] mt-1 tabular-nums">19:20:{10 + i}</span>
              <p className="text-base tracking-tight leading-none">{line}</p>
            </motion.div>
          ))}
          {lines.length === terminalLines.length && (
            <div className="flex items-center gap-8">
              <span className="opacity-20 text-[11px] tabular-nums invisible">00:00:00</span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-3 h-6 bg-emerald-500"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Portfolio Sections ---

const LegoSection = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="intro" className="min-h-screen pt-32 pb-40 bg-[#fdf7ff] relative overflow-hidden">
      {/* Lego Brick Background Pattern */}
      <div className="absolute inset-0 z-0 grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] opacity-70 mix-blend-multiply pointer-events-none">
        {Array.from({ length: 1500 }).map((_, i) => (
          <div 
            key={i} 
            className={`aspect-square lego-stud relative border border-black/15 ${
              i % 5 === 0 ? 'bg-[#e53935]/25' : i % 5 === 1 ? 'bg-[#1e88e5]/25' : i % 5 === 2 ? 'bg-[#ffeb3b]/25' : i % 5 === 3 ? 'bg-[#43a047]/25' : 'bg-slate-300/40'
            }`} 
          />
        ))}
      </div>
      
      {/* Darkness Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#4a3424] pointer-events-none z-10" />

      <div className="max-w-8xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-20">
        <div className="md:col-span-12 lg:col-span-8 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 bg-[#ffeb3b] text-slate-900 font-bold rounded-lg shadow-[4px_4px_0px_0px_#fbc02d] border-2 border-slate-900 uppercase text-xs tracking-wider"
          >
            Electronics Enthusiast // ECE 
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="font-sans text-7xl md:text-9xl font-black text-slate-900 leading-none tracking-tighter uppercase">
              SHINE <span className="text-[#1e88e5]">DANIEL</span>
            </h1>
            <p className="text-3xl md:text-4xl font-bold text-[#e53935] uppercase font-sans tracking-tight">
              Aspiring VLSI & Embedded Systems Engineer
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-800 text-2xl max-w-3xl font-medium leading-relaxed bg-white/40 backdrop-blur-sm p-8 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]"
          >
            Proactive Electronics enthusiast who loves to work on projects, gain knowledge and practical skills while building connections with like-minded individuals. I help shape a better future for Electronauts.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-8 pt-4"
          >
            <button 
              onClick={() => scrollToSection('projects')}
              className="h-16 px-12 lego-button-3d text-white font-black flex items-center gap-4 uppercase tracking-widest text-lg border-2 border-black/20 cursor-pointer"
            >
              <CircuitBoard className="w-6 h-6" />
              My Work
            </button>
            <a 
              href="Resume_Shine%20Daniel.pdf"
              download="Resume_Shine_Daniel.pdf"
              className="h-16 px-12 lego-button-3d lego-button-3d-blue text-white font-black flex items-center gap-4 uppercase tracking-widest text-lg border-2 border-black/20 cursor-pointer"
            >
              <DraftingCompass className="w-6 h-6" />
              Resume
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4 relative flex justify-center mt-12 lg:mt-0"
        >
          
        </motion.div>
      </div>
    </section>
  );
};

const MinecraftSection = () => {
  const experiences = [
    { 
      title: 'Hardware Internship', 
      sub: 'Magnum Technology Center, Dubai', 
      icon: 'Redstone', 
      img: 'redstone.png',
      desc: 'Focused on PLC Programming and gaining exposure to industrial safety standards in JAFZA, Dubai (May-June 2025).' 
    },
    { 
      title: 'Vegathon - Organizer', 
      sub: 'ECE Dept & C-DAC', 
      icon: 'Piston', 
      img: 'torch.png',
      desc: 'Contributed to organizing many national-level hackathon - CarbonX, in collaboration with C-DAC.' 
    },
    { 
      title: 'Media Member', 
      sub: 'RSET Media Team', 
      icon: 'Repeater', 
      img: 'Repeater.png',
      desc: 'Contributing to recording/capturing collegiate events and coordinating technical media infrastructure for major celebrations.' 
    },
    { 
      title: ' Technical Coord and Organizing', 
      sub: 'Electronauts', 
      icon: 'Comparator', 
      img: 'comparator.png',
      desc: 'Organized tech-fest events including Blindbuild 2.0, Codequest 2.0, Chips2Silicon, and Wire it right and many other activity hour events.' 
    },
    { 
      title: 'Volunteering', 
      sub: 'IEDC & GDSC Events', 
      icon: 'Piston', 
      img: 'piston.png',
      desc: 'Contributed to organizing many tech events from normal activity hours to national-level tech fests.' 
    },
    
  ];

  return (
    <section id="experience" className="min-h-screen py-32 bg-[#4a3424] text-white relative overflow-hidden">
      {/* Darkened Dirt Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply" style={{
        backgroundImage: `url('https://www.transparenttextures.com/patterns/dark-matter.png')`,
        backgroundSize: '256px 256px'
      }} />
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
        backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)`,
        backgroundSize: '64px 64px'
      }} />
      
      {/* Color transition to next section */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black pointer-events-none z-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 flex flex-col md:flex-row justify-between items-center md:items-end gap-8"
        >
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-[#10b981] mb-2 leading-none font-minecraft">Experiences</h2>
              <p className="text-stone-400 text-[12px] tracking-widest uppercase font-minecraft">Enchantment_Level XXX// Professional_Experience</p>
            </div>
          </div>
          <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-[30px] h-[30px] border-4 border-slate-900 shadow-inner mt-[10px] bg-white ${i === 1 ? 'pl-[1px]' : ''}`} 
                />
              ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#3d2b1f] p-8 border-4 border-slate-900 shadow-[inset_4px_4px_0px_0px_rgba(255,255,255,0.05),inset_-4px_-4px_0px_0px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row gap-8 items-center sm:items-start group hover:bg-[#523d2d] transition-colors"
            >
              <div className="shrink-0 w-[80px] h-[80px] bg-slate-900/40 border-4 border-slate-900 flex items-center justify-center p-2 group-hover:-translate-y-1 transition-transform">
                <img src={exp.img} alt={exp.icon} className="w-full h-full object-contain -mt-[2px]" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold mb-1 text-white uppercase font-minecraft">{exp.title}</h3>
                <p className="text-[#10b981] text-xs mb-4 uppercase tracking-[0.2em] font-minecraft">@{exp.sub}</p>
                <p className="text-stone-300 text-xs leading-relaxed font-sans font-medium">{exp.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SchematicSection = () => {
  const projects = [
    { title: 'Audio Spectrum Analyzer', id: 'ECE_001', tags: ['Analog', 'DSP'], desc: '2 Band Audio Spectrum Analyzer with real-time waveform visualization and signal capture.' },
    { title: '4-Bit Binary Adder', id: 'ECE_002', tags: ['Hardware', 'Transistors'], desc: 'Complete binary adder logic implemented using only discrete transistors to demonstrate logic gate synthesis.' },
    { title: 'Robotic Arm Sim', id: 'ECE_003', tags: ['ROS', 'Gazebo', 'Rviz'], desc: 'Detailed simulation of robotic arm movements including kinematics and motion planning environments.' },
    { title: 'BT RC Car Control', id: 'ECE_004', tags: ['Arduino', 'Bluetooth', 'LCD'], desc: 'Wireless vehicle control system with real-time telemetry displayed on a mounted LCD interface.' },
    { title: 'Freq Multiplier', id: 'ECE_005', tags: ['CD4046', 'PLL'], desc: 'Signal synthesis circuit for frequency multiplication utilizing Phase-Locked Loop (PLL) stability.' },
    { title: 'Light Screaming Circuit', id: 'ECE_006', tags: ['Oscillator', 'Sensors'], desc: 'Analog oscillator whose audio frequency scales linearly with incident light intensity.' },
  ];

  return (
    <section id="projects" className="min-h-screen py-32 bg-[#111111] text-emerald-500 font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-emerald-500/20 pb-10"
        >
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.4em] text-emerald-500/40 font-bold block">SECTION_03 // HW_ARCH</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">Project Schematics</h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((proj, i) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group border border-emerald-500/20 bg-emerald-950/10 p-8 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500/30 group-hover:border-emerald-500/60 transition-colors" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500/30 group-hover:border-emerald-500/60 transition-colors" />

              <div className="text-[10px] text-emerald-500/50 mb-8 flex justify-between items-center font-bold">
                <span className="bg-emerald-950 px-2 py-1 border border-emerald-500/20 uppercase">{proj.id}</span>
              </div>
              
              <h3 className="text-2xl font-bold uppercase mb-6 text-white group-hover:text-emerald-400 transition-colors tracking-tight">
                {proj.title}
              </h3>
              
              <p className="text-emerald-500/50 text-sm mb-10 leading-relaxed font-sans font-medium">
                {proj.desc}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {proj.tags.map(tag => (
                  <span key={tag} className="text-[9px] px-2 py-1 border border-emerald-500/10 text-emerald-500/20 uppercase font-black">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const InterestsSection = () => {
  const interests = [
    { title: 'Embedded Systems', icon: <Cpu className="w-8 h-8 transition-colors duration-300 group-hover:text-amber-400" />, color: 'emerald' },
    { title: 'VLSI design', icon: <CircuitBoard className="w-8 h-8 transition-colors duration-300 group-hover:text-blue-400" />, color: 'blue' },
    { title: 'DSP & Modulation', icon: <Monitor className="w-8 h-8 transition-colors duration-300 group-hover:text-purple-400" />, color: 'purple' },
    { title: 'Industrial Safety', icon: <Layers className="w-8 h-8 transition-colors duration-300 group-hover:text-emerald-400" />, color: 'amber' },
  ];

  return (
    <section id="interests" className="py-32 bg-[#111111] border-t border-emerald-500/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mb-20 text-center"
        >
          <span className="text-[10px] uppercase tracking-[0.5em] text-emerald-500/40 font-bold block mb-4">SECTION_04 // DOMAIN_FOCUS</span>
          <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Fields of Interest</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {interests.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-10 bg-emerald-950/10 border border-emerald-500/10 flex flex-col items-center text-center group hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all"
            >
              <div className="p-5 rounded-full bg-black/40 border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                {React.cloneElement(item.icon as React.ReactElement, { className: 'text-emerald-400' })}
              </div>
              <h3 className="text-white font-mono font-bold uppercase tracking-widest">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactSection = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section id="contact" className="py-32 bg-[#111111] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mb-20 text-center"
        >
          <span className="text-[10px] uppercase tracking-[0.5em] text-emerald-500/40 font-bold block mb-4">SECTION_05 // COMMS_ESTABLISHED</span>
          <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Get In Touch</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.button 
            onClick={() => copyToClipboard('shine.kaine2249@gmail.com', 'email')}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 bg-black/40 border border-white/10 rounded-2xl flex flex-col items-center text-center hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all group relative cursor-pointer"
          >
            <Mail className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">{copied === 'email' ? 'Copied!' : 'shine.kaine2249@gmail.com'}</span>
            <div className="absolute bottom-4 text-[9px] uppercase tracking-widest text-white/20 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Click to copy</div>
          </motion.button>

          <motion.button 
            onClick={() => copyToClipboard('+91 6235415041', 'phone')}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 bg-black/40 border border-white/10 rounded-2xl flex flex-col items-center text-center hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all group relative cursor-pointer"
          >
            <Phone className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">{copied === 'phone' ? 'Copied!' : '+91 6235415041'}</span>
            <div className="absolute bottom-4 text-[9px] uppercase tracking-widest text-white/20 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Click to copy</div>
          </motion.button>

          <motion.a 
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 bg-black/40 border border-white/10 rounded-2xl flex flex-col items-center text-center hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all group cursor-pointer"
          >
            <Github className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">GitHub Profile</span>
          </motion.a>

          <motion.a 
            href="https://www.linkedin.com/in/shine-daniel2"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-8 bg-black/40 border border-white/10 rounded-2xl flex flex-col items-center text-center hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all group cursor-pointer"
          >
            <Linkedin className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">LinkedIn Profile</span>
          </motion.a>
        </div>
      </div>
    </section>
  );
};

// --- Main App ---

export default function App() {
  const [state, setState] = useState<AppState>('loading');
  const [activeSection, setActiveSection] = useState('intro');

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (state !== 'portfolio') return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = ['intro', 'experience', 'projects', 'interests', 'contact'];
    
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [state]);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-500 selection:text-black">
      <AnimatePresence>
        {state === 'loading' && (
          <LoadingScreen key="loading" onComplete={() => setState('terminal')} />
        )}
        {state === 'terminal' && (
          <TerminalScreen key="terminal" onComplete={() => setState('portfolio')} />
        )}
      </AnimatePresence>

      {state === 'portfolio' && (
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <header className="fixed top-0 w-full z-[100] h-20 bg-white/40 backdrop-blur-md border-b-4 border-slate-900 flex justify-between items-center px-6 md:px-12 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#e53935] border-2 border-slate-900 shadow-[2px_2px_0px_0px_#b71c1c]" />
              <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">SHINE//ECE</span>
            </div>
            
            <nav className="hidden lg:flex items-center gap-4 uppercase font-bold text-[10px] tracking-widest leading-none">
              <button 
                onClick={() => scrollToSection('intro')} 
                className={`px-4 py-2 transition-all rounded cursor-pointer hover:scale-110 active:scale-95 uppercase border-2 ${
                  activeSection === 'intro' ? 'border-slate-900 text-slate-900 bg-white/50' : 'border-transparent text-black hover:text-white hover:bg-black'
                }`}
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('experience')} 
                className={`px-4 py-2 transition-all rounded cursor-pointer hover:scale-110 active:scale-95 uppercase border-2 ${
                  activeSection === 'experience' ? 'border-slate-900 text-slate-900 bg-white/50' : 'border-transparent text-black hover:text-white hover:bg-black'
                }`}
              >
                Experience
              </button>
              <button 
                onClick={() => scrollToSection('projects')} 
                className={`px-4 py-2 transition-all rounded cursor-pointer hover:scale-110 active:scale-95 uppercase border-2 ${
                  activeSection === 'projects' ? 'border-slate-900 text-slate-900 bg-white/50' : 'border-transparent text-black hover:text-white hover:bg-black'
                }`}
              >
                Projects
              </button>
              <button 
                onClick={() => scrollToSection('interests')} 
                className={`px-4 py-2 transition-all rounded cursor-pointer hover:scale-110 active:scale-95 uppercase border-2 ${
                  activeSection === 'interests' ? 'border-slate-900 text-slate-900 bg-white/50' : 'border-transparent text-black hover:text-white hover:bg-black'
                }`}
              >
                Skills
              </button>
            </nav>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => scrollToSection('contact')}
                className={`flex items-center font-black rounded border-2 border-slate-900 uppercase text-[10px] transition-all cursor-pointer hover:scale-105 px-6 h-10 ${
                  activeSection === 'contact' 
                    ? 'bg-white text-slate-900 border-4 shadow-none' 
                    : 'bg-[#e53935] text-white shadow-[3px_3px_0px_0px_#b71c1c] active:translate-y-1 active:shadow-none'
                }`}
              >
                Connect
              </button>
            </div>
          </header>

          <main>
            <LegoSection />
            <MinecraftSection />
            <SchematicSection />
            <InterestsSection />
            <ContactSection />
          </main>

          <footer className="bg-[#0a0a0a] py-20 text-slate-500 font-mono border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
              <div className="mb-12">
                <div className="text-8xl font-black text-white/5 select-none leading-none">Lets Cook ;D</div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] uppercase font-bold tracking-[0.4em]">
                <div className="flex items-center gap-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>© SHINE DANIEL // ECE // 2026</span>
                </div>
                <div className="flex gap-8">
                  <span>MENTAL_STATE: OPERATIONAL</span>
                  <span>ENCRYPTION: GENZ-256</span>
                </div>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </div>
  );
}
