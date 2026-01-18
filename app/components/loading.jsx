// pages/lodg.jsx
import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <Image
        src="/loading.gif"
        alt="Loading..."
        width={150}  
        height={150} 
        className="object-contain"
      />
    </div>
  );
}
