"use client";

import React from "react";
import PageHero from "../components/PageHero";
import { Phone, Linkedin, Github, Mail, MapPin } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

// Better WhatsApp icon
const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.52 3.48a11.92 11.92 0 00-16.88 0 11.92 11.92 0 000 16.88l-1.34 4.86 4.99-1.31a11.92 11.92 0 0012.23-19.43zM12 21.95c-1.2 0-2.39-.33-3.44-.95l-.25-.15-2.96.78.79-2.88-.17-.28a9.93 9.93 0 1114.22-14.2 9.91 9.91 0 01-8.19 16.7z"/>
    <path d="M17.05 14.06c-.28-.14-1.64-.81-1.89-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.13-1.17-.43-2.23-1.38-.82-.73-1.37-1.63-1.53-1.91-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.35-.02-.49-.07-.14-.61-1.47-.84-2.01-.22-.52-.44-.45-.61-.46-.16-.01-.35-.01-.54-.01s-.49.07-.75.35c-.25.28-.95.93-.95 2.28s.97 2.65 1.1 2.83c.14.18 1.9 2.88 4.61 4.04.64.28 1.14.45 1.53.58.64.21 1.22.18 1.68.11.51-.08 1.64-.67 1.87-1.31.22-.64.22-1.18.16-1.31-.07-.13-.25-.21-.53-.35z"/>
  </svg>
);

export default function ContactPage() {
  const { language } = useLanguage();
  const t = translations[language].contact;

  return (
    <>
      <PageHero
        titleKey="contact.contactUs"
        subtitleKey=""                   // no subtitle
        backgroundImage="/slike/poz2.png"
        minHeight="40vh"
        maxHeight="60vh"
      />

      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:gap-6">
          {/* Ivica */}
          <div className="group flex-1 bg-gray-50 p-4 rounded shadow-lg transform transition duration-500 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl">
            <h3 className="text-lg font-semibold">Ivica Antunović</h3>
            <p className="flex items-center gap-2 mt-1">
              <Phone size={18} />
              <a href="tel:+385915484394" className="hover:underline">+385 91 548 4394</a>
              <span className="inline-block transform transition duration-300 hover:-translate-y-1">
                <WhatsappIcon className="ml-2 w-5 h-5 text-green-600" />
              </span>
            </p>
          </div>

          {/* Jure */}
          <div className="group flex-1 bg-gray-50 p-4 rounded shadow-lg transform transition duration-500 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl">
            <h3 className="text-lg font-semibold">Jure Antunović</h3>
            <p className="flex items-center gap-2 mt-1">
              <Phone size={18} />
              <a href="tel:+385989610125" className="hover:underline">+385 98 961 0125</a>
              <span className="inline-block transform transition duration-300 hover:-translate-y-1">
                <WhatsappIcon className="ml-2 w-5 h-5 text-green-600" />
              </span>
            </p>

            <div className="flex gap-4 mt-2">
              <a href="https://www.linkedin.com/in/jure-a-049758200/" target="_blank" rel="noopener noreferrer" className="transform transition duration-300 hover:-translate-y-1 hover:text-blue-800">
                <Linkedin size={24} />
              </a>
              <a href="https://github.com/Jure13" target="_blank" rel="noopener noreferrer" className="transform transition duration-300 hover:-translate-y-1 hover:text-gray-700">
                <Github size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="group bg-gray-50 p-4 rounded shadow-lg transform transition duration-500 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl mx-auto max-w-xl space-y-2">
          <h3 className="text-lg font-semibold">{t.address}</h3>
          <p className="flex items-center gap-2">
            Otrić-Seoci 117, Pojezerje 20342
            <a href="https://maps.app.goo.gl/zXEPEbG4NaiD5tB67" target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 transform transition duration-300 hover:text-blue-800 hover:-translate-y-1 inline-block">
              <MapPin size={20} />
            </a>
          </p>
          <p className="flex items-center gap-2">
            <Mail size={18} />
            <a href="mailto:kontakt@vina-ivas.hr" className="ml-1 underline hover:text-blue-700">
              kontakt@vina-ivas.hr
            </a>
          </p>
        </div>
      </section>
    </>
  );
}