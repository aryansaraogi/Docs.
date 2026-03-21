function Background() {
  return (
    <div className="fixed z-[2] w-full h-screen pointer-events-none">
      <div className="absolute top-0 w-full py-4 sm:py-6 flex justify-center text-zinc-400 text-sm sm:text-base font-medium tracking-widest uppercase">
        Documents
      </div>
      <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] sm:text-[15vw] md:text-[13vw] leading-none tracking-tighter font-semibold text-zinc-800 select-none">
        Docs.
      </h1>
    </div>
  );
}
export default Background;
