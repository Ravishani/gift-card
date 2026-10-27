import Image from "next/image";
import Header from "./layouts/header";
import Hero from "./homepage/hero";
import GiftCardSections from "./homepage/GiftCardSections";
import Footer from "./layouts/footer";

export default function Home() {
  return (
    <>
    
    <Hero/>
    <GiftCardSections/>
    </>
  );
}
