"use client";
export const dynamic = "force-dynamic";

import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

export default function Home() {
  const { status } = useSession();

  // Animation variants for staggering effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Time delay between each child animating
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    // Main container with the animated aurora background
    <div className="relative min-h-full w-full flex flex-col overflow-hidden aurora-background">

      {/* Centered content with staggered animations */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          className="text-center flex flex-col items-center gap-6 z-10 p-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Animated Logo */}
          <motion.div variants={itemVariants}>
            <Icons.logo className="h-20 w-20 text-white fill-white" />
          </motion.div>

          {/* Animated Title and Tagline */}
          <motion.div variants={itemVariants} className="flex flex-col gap-2">
            <p className="text-gray-300 text-lg">
              پلتفرم مدیریت تست BDD برای تیم‌های توسعه
            </p>
          </motion.div>

          {/* Animated Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center gap-4 mt-4"
          >
            {status === "authenticated" ? (
              <Button asChild size="lg" className="w-40 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg">
                <Link href="/projects">مشاهده پروژه‌ها</Link>
              </Button>
            ) : (
              <>
            <Button asChild size="lg" className="w-40 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg">
              <Link href="/sign-up">شروع کنید</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-40 bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/70 hover:border-gray-500 shadow-lg">
              <Link href="/sign-in">ورود</Link>
            </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Footer at the bottom */}
      <footer className="text-center text-sm text-gray-400 z-10 py-6">
        Developed by Nemesis Team
      </footer>
    </div>
  );
}