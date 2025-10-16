import { db } from '@/db';
import { transactionCategories } from '@/db/schema';

async function main() {
    const sampleCategories = [
        {
            name: 'Income',
            icon: '💰',
            color: '#10B981',
            isIncome: true,
        },
        {
            name: 'Salary',
            icon: '💵',
            color: '#059669',
            isIncome: true,
        },
        {
            name: 'Food & Dining',
            icon: '🍽️',
            color: '#F59E0B',
            isIncome: false,
        },
        {
            name: 'Groceries',
            icon: '🛒',
            color: '#84CC16',
            isIncome: false,
        },
        {
            name: 'Transport',
            icon: '🚗',
            color: '#3B82F6',
            isIncome: false,
        },
        {
            name: 'Shopping',
            icon: '🛍️',
            color: '#EC4899',
            isIncome: false,
        },
        {
            name: 'Entertainment',
            icon: '🎬',
            color: '#8B5CF6',
            isIncome: false,
        },
        {
            name: 'Bills & Utilities',
            icon: '📄',
            color: '#EF4444',
            isIncome: false,
        },
        {
            name: 'Healthcare',
            icon: '🏥',
            color: '#14B8A6',
            isIncome: false,
        },
        {
            name: 'Education',
            icon: '📚',
            color: '#6366F1',
            isIncome: false,
        },
        {
            name: 'Travel',
            icon: '✈️',
            color: '#06B6D4',
            isIncome: false,
        },
        {
            name: 'Investments',
            icon: '📈',
            color: '#10B981',
            isIncome: false,
        },
        {
            name: 'Subscriptions',
            icon: '📱',
            color: '#F97316',
            isIncome: false,
        },
        {
            name: 'Personal Care',
            icon: '💅',
            color: '#A855F7',
            isIncome: false,
        },
        {
            name: 'Others',
            icon: '📦',
            color: '#6B7280',
            isIncome: false,
        }
    ];

    await db.insert(transactionCategories).values(sampleCategories);
    
    console.log('✅ Transaction categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});