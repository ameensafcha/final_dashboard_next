"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function DailyPlanPage() {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        const getTodayPlan = async () => {
            try {
                const todayPlan = await axios.get("/api/daily-task/");
                setPlan(todayPlan.data);
            
            } catch (error) {
                console.error("Error fetching today's plan f:", error);
            }finally{
                setLoading(false);
            }
        }
        
        getTodayPlan();
    },[])
    return (
        <div>

        </div>
    )
}