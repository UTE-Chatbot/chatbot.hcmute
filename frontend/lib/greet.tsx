import { AuroraText } from "@/components/ui/aurora-text";

export function getGreeting(name?: string | null): any {
  const hour = new Date().getHours();

  if (name) {
    let greeting = "";
    if (hour >= 5 && hour < 12) {
      greeting = "Chào buổi sáng ☀️";
    } else if (hour >= 12 && hour < 18) {
      greeting = "Chào buổi chiều 🌤️";
    } else {
      greeting = "Chào buổi tối 🌙";
    }

    return [greeting + ", ", <AuroraText key="name">{name}</AuroraText>];
  }

  let timeText = "";
  let icon = "";

  if (hour >= 5 && hour < 12) {
    timeText = "buổi sáng";
    icon = "☀️";
  } else if (hour >= 12 && hour < 18) {
    timeText = "buổi chiều";
    icon = "🌤️";
  } else {
    timeText = "buổi tối";
    icon = "🌙";
  }

  return [
    <span key="greeting">
      Chào <AuroraText key="time">{timeText}</AuroraText>
    </span>,
    ` ${icon}`,
  ];
}
