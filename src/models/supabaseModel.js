const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

exports.supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-Client-Info': 'backend'
    }
  }
});

exports.SupabaseModel = {
  async getAdminByEmail(email) {
    return this.supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();
  },

  async getAllProducts() {
    return this.supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
  },

  async createProduct(productData) {
    // Convert image_url to array if it's not already
    const images = Array.isArray(productData.image_url) 
      ? productData.image_url 
      : [productData.image_url].filter(Boolean);
    
    return this.supabase
      .from('products')
      .insert([{
        ...productData,
        image_url: images
      }])
      .select('*')
      .single();
  },
  async verifyAdmin(token) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', user.email)
      .single();
      
    if (adminError || !admin) throw new Error('Admin not found');
    return admin;
  },
  async updateProduct(id, productData) {
    return this.supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select('*')
      .single();
  },

  async deleteProduct(id) {
    return this.supabase
      .from('products')
      .delete()
      .eq('id', id);
  },

  async createQuote(quoteData) {
    return this.supabase
      .from('quotes')
      .insert([quoteData])
      .select('*')
      .single();
  },

  async getQuoteByTracking(trackingCode) {
    return this.supabase
      .from('quotes')
      .select(`
        *,
        quote_items:quote_items(*, product:products(*))
      `)
      .eq('tracking_code', trackingCode)
      .single();
  },

  async getAllQuotes() {
    return this.supabase
      .from('quotes')
      .select(`
        *,
        quote_items:quote_items(*, product:products(*))
      `)
      .order('created_at', { ascending: false });
  },

  async updateQuoteStatus(id, status, adminNotes) {
    return this.supabase
      .from('quotes')
      .update({ status, admin_notes: adminNotes })
      .eq('id', id)
      .select('*')
      .single();
  },

  async createVerificationCode(email, code, expiresAt) {
    return this.supabase
      .from('verification_codes')
      .insert([{
        contact: email,
        code,
        expires_at: expiresAt
      }]);
  },

  async verifyCode(email, code) {
    return this.supabase
      .from('verification_codes')
      .select('*')
      .eq('contact', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .eq('used', false)
      .single();
  },

  async markCodeAsUsed(id) {
    return this.supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', id);
  },

  async markQuoteAsVerified(email) {
    return this.supabase
      .from('quotes')
      .update({ verified: true })
      .eq('guest_email', email);
  }
};