import { FaLinkedin, FaXTwitter, FaFacebook, FaYoutube } from "react-icons/fa6";

const SOCIAL_LINKS = [
  { href: "https://linkedin.com", icon: FaLinkedin, label: "LinkedIn" },
  { href: "https://x.com",        icon: FaXTwitter, label: "X" },
  { href: "https://facebook.com", icon: FaFacebook, label: "Facebook" },
  { href: "https://youtube.com",  icon: FaYoutube,  label: "YouTube" },
] as const;

export const SocialLinks = () => (
  <div className="flex items-center gap-3">
    {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
      <a
        key={label}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="text-celery-500 hover:text-celery-400"
      >
        <Icon className="h-5 w-5" />
      </a>
    ))}
  </div>
);