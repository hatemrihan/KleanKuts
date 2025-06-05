/**
 * Integration with the admin waitlist API as specified
 */
export const submitToWaitlist = async (email: string, p0: string): Promise<boolean> => {
  try {
    const response = await fetch('https://eleveadmin.netlify.app/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        source: 'e-commerce',  // This helps track where submissions come from
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      const data = await response.json();
      return true;
    } else {
      throw new Error('Failed to submit to waitlist');
    }
  } catch (error) {
    console.error('Waitlist submission error:', error);
    throw error;
  }
}
