import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';

interface CircularGaugeProps {
  value: number;
  maxValue?: number;
  size?: number;
}

export default function CircularGauge({ value, maxValue = 100, size = 200 }: CircularGaugeProps) {
  const percentage = (value / maxValue) * 100;
  
  const getColor = (val: number) => {
    if (val >= 75) return '#10b981'; // green-600
    if (val >= 50) return '#f59e0b'; // orange-600
    return '#ef4444'; // red-600
  };

  const color = getColor(value);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      style={{ width: size, height: size }}
    >
      <CircularProgressbar
        value={percentage}
        text={`${value}`}
        styles={buildStyles({
          textSize: '28px',
          pathColor: color,
          textColor: color,
          trailColor: '#e5e7eb',
          pathTransitionDuration: 1.5,
        })}
      />
    </motion.div>
  );
}
