import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface SimpleBookingFlowProps {
  mentorName: string;
  onBook: (date: Date, time: string) => void;
  loading?: boolean;
}

export const SimpleBookingFlow = ({ 
  mentorName, 
  onBook, 
  loading = false 
}: SimpleBookingFlowProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Sample time slots (you can fetch these from your availability API)
  const timeSlots: TimeSlot[] = [
    { id: "1", time: "09:00 AM", available: true },
    { id: "2", time: "10:00 AM", available: true },
    { id: "3", time: "11:00 AM", available: false },
    { id: "4", time: "02:00 PM", available: true },
    { id: "5", time: "03:00 PM", available: true },
    { id: "6", time: "04:00 PM", available: true },
    { id: "7", time: "05:00 PM", available: false },
    { id: "8", time: "06:00 PM", available: true },
  ];

  const handleConfirmBooking = () => {
    if (selectedTime) {
      onBook(selectedDate, selectedTime);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Book Session with {mentorName}</h3>
        <p className="text-muted-foreground">
          Select a date and time that works for you
        </p>
        <Badge variant="success" className="text-xs">
          ✨ Free Sessions - No Payment Required
        </Badge>
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-primary" />
          <span>Select Date</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {dates.map((date, index) => {
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const isToday = index === 0;
            
            return (
              <button
                key={index}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all duration-200 text-center",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                )}
              >
                <div className="text-xs text-muted-foreground font-medium">
                  {isToday ? "Today" : format(date, 'EEE')}
                </div>
                <div className="text-lg font-bold mt-1">
                  {format(date, 'd')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(date, 'MMM')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-primary" />
          <span>Select Time</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {timeSlots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            
            return (
              <button
                key={slot.id}
                onClick={() => slot.available && setSelectedTime(slot.time)}
                disabled={!slot.available}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all duration-200 font-medium",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : slot.available
                    ? "border-border hover:border-primary/50 hover:bg-accent"
                    : "border-border bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                )}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation */}
      {selectedTime && (
        <Card variant="premium" className="p-4 bg-primary/5 border-primary/20">
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">You're booking:</p>
            <p className="text-lg font-bold">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
            </p>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="premium"
          size="lg"
          className="flex-1 shadow-glow"
          onClick={handleConfirmBooking}
          disabled={!selectedTime || loading}
        >
          {loading ? "Confirming..." : "Confirm Booking ✨"}
        </Button>
      </div>

      {/* Note */}
      <p className="text-xs text-center text-muted-foreground">
        Sessions are currently free. You'll receive a confirmation notification once booked.
      </p>
    </div>
  );
};
