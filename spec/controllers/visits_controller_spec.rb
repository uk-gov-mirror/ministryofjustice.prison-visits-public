require 'rails_helper'

RSpec.describe VisitsController, type: :controller do
  describe 'show' do
    let(:visit) { instance_double(Visit, id: '123456789', processing_state: :rejected) }

    subject(:show) { get :show, id: visit.id, locale: 'en' }

    context 'the visit is found' do
      before do
        expect(pvb_api).
          to receive(:get_visit).
          with(visit.id, allow_not_found: true).
          and_return(visit)
      end

      it 'calls the get visit API' do
        get :show, id: visit.id, locale: 'en'
        expect(assigns(:visit)).to eq(visit)
      end

      context "rendering views" do
        render_views

        it { expect { show }.to_not raise_error }
      end
    end

    context 'the visit is not found' do
      before do
        expect(pvb_api).
          to receive(:get_visit).
          with(visit.id, allow_not_found: true).
          and_return(nil)
      end

      it { expect(show).to render_template('errors/404') }
    end
  end
end
