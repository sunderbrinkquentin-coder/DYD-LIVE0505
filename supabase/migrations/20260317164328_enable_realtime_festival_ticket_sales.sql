/*
  # Enable Realtime on festival_ticket_sales

  Adds festival_ticket_sales to the supabase_realtime publication so the
  FestivalPaymentSuccessPage can listen for INSERT events instead of polling.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE festival_ticket_sales;
