import {
  Car,
  ChatsCircle,
  Code,
  Cpu,
  Envelope,
  GithubLogo,
  GraduationCap,
  LinkedinLogo,
  PawPrint,
  Robot,
  SealCheck,
  ShoppingBag,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { IconName } from "@/data/site";

const icons: Record<IconName, PhosphorIcon> = {
  paw: PawPrint,
  robot: Robot,
  check: SealCheck,
  bag: ShoppingBag,
  cpu: Cpu,
  chat: ChatsCircle,
  code: Code,
  car: Car,
  graduation: GraduationCap,
  envelope: Envelope,
  github: GithubLogo,
  linkedin: LinkedinLogo,
};

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const Component = icons[name];
  return <Component size={size} weight="bold" className={className} />;
}
