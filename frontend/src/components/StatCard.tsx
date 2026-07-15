import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color: 'red' | 'green' | 'teal';
  icon: React.ReactNode;
}

const cardClass  = { red: styles.cardRed,   green: styles.cardGreen,   teal: styles.cardTeal  };
const iconClass  = { red: styles.iconRed,   green: styles.iconGreen,   teal: styles.iconTeal  };
const valueClass = { red: styles.valueRed,  green: styles.valueGreen,  teal: styles.valueTeal };

export function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  return (
    <div className={`${styles.card} ${cardClass[color]}`}>
      <div className={`${styles.iconWrap} ${iconClass[color]}`}>
        {icon}
      </div>
      <p className={styles.label}>{label}</p>
      <p className={`${styles.value} ${valueClass[color]}`}>{value}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  );
}
