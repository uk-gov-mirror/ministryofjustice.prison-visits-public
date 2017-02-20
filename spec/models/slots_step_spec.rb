require 'rails_helper'

RSpec.describe SlotsStep, type: :model do
  subject(:instance) { described_class.new }

  describe 'validation of options' do
    let(:slot) { ConcreteSlot.new(2015, 1, 2, 9, 0, 10, 0) }

    let(:prisoner_step) {
      instance_double(PrisonerStep, first_name: 'John')
    }

    let(:processor) {
      instance_double(StepsProcessor,
        booking_constraints: booking_constraints,
        prisoner_step: prisoner_step)
    }

    let(:booking_constraints) {
      instance_double(
        BookingConstraints,
        on_slots: BookingConstraints::SlotConstraints.new([slot])
      )
    }

    before do
      allow(instance).
        to receive(:processor).and_return(processor)

      allow(processor).to receive(:booking_constraints).
        and_return(booking_constraints)
    end

    it 'is valid if the option is a correctly formatted time range' do
      subject.option_0 = '2015-01-02T09:00/10:00'
      expect(subject).to be_valid
      expect(subject.errors).not_to have_key(:option_0)
    end

    it 'is invalid if the option is not a time range' do
      subject.option_0 = '2015-01-02T09:00'
      expect(subject).not_to be_valid
      expect(subject.errors).to have_key(:option_0)
    end

    it 'is invalid if option_0 is empty' do
      subject.option_0 = ''
      subject.valid?
      expect(subject.errors).to have_key(:option_0)
    end

    it 'is invalid if the slots are not bookable slots' do
      subject.option_0 = '2015-01-02T09:00/11:00'
      subject.option_1 = '2015-01-02T09:00/12:00'
      subject.option_2 = '2015-01-02T09:00/13:00'
      subject.valid?
      expect(subject.errors).to have_key(:option_0)
      expect(subject.errors).to have_key(:option_1)
      expect(subject.errors).to have_key(:option_2)
    end

    it 'is valid if option_1 is empty' do
      subject.option_1 = ''
      subject.valid?
      expect(subject.errors).not_to have_key(:option_1)
    end

    it 'is valid if option_2 empty' do
      subject.option_2 = ''
      subject.valid?
      expect(subject.errors).not_to have_key(:option_2)
    end
  end

  shared_examples :options_are_available do
    it 'Options are available' do
      expect(subject.options_available?).to eq(true)
    end
  end

  shared_examples :options_are_not_available do
    it 'Options are not available' do
      expect(subject.options_available?).to eq(false)
    end
  end

  shared_examples :next_to_fill_is do |option_num|
    it "Next to fill is #{option_num}" do
      expect(subject.next_slot_to_fill).to eq(option_num.to_s)
    end
  end

  context '#options_available?' do
    context 'After posting from Prisoner page' do
      it_behaves_like :options_are_available
      it_behaves_like :next_to_fill_is, 0
    end

    context 'After posting from Slot 1 page' do
      before do
        subject.option_0 = '2015-01-02T09:00/10:00'
        subject.currently_filling = '0'
      end

      it_behaves_like :options_are_available
      it_behaves_like :next_to_fill_is, 1
    end

    context 'After posting from Slot 1 page from save and skip link' do
      before do
        subject.option_0 = '2015-01-02T09:00/10:00'
        subject.currently_filling = '0'
        subject.skip_remaining_slots = 'true'
      end

      it_behaves_like :options_are_not_available
      it_behaves_like :next_to_fill_is, 1
    end

    context 'After posting from Slot 2 page' do
      before do
        subject.option_0 = '2015-01-02T09:00/10:00'
        subject.option_1 = '2015-01-03T09:00/10:00'
        subject.currently_filling = '1'
      end

      it_behaves_like :options_are_available
      it_behaves_like :next_to_fill_is, 2
    end

    context 'After posting from Slot 3 page having not filled slot 3' do
      before do
        subject.option_0 = '2015-01-02T09:00/10:00'
        subject.option_1 = '2015-01-03T09:00/10:00'
        subject.currently_filling = '2'
      end

      it_behaves_like :options_are_not_available
      it_behaves_like :next_to_fill_is, 2
    end

    context 'After posting from visitor page' do
      before do
        subject.option_0 = '2015-01-02T09:00/10:00'
        subject.option_1 = '2015-01-03T09:00/10:00'
        subject.currently_filling = '2'
      end

      it_behaves_like :options_are_not_available
      it_behaves_like :next_to_fill_is, 2
    end

    context 'After posting from Review slot 2 link on review page' do
      before do
        subject.option_0 = '2015-01-02T09:00/10:00'
        subject.option_1 = '2015-01-03T09:00/10:00'
        subject.review_slot = '1'
      end

      it_behaves_like :options_are_available
      it_behaves_like :next_to_fill_is, 1
    end

    context 'After posting from Slot 2 page when reviewing' do
      before do
        subject.option_0 = '2015-01-02T09:00/10:00'
        subject.option_1 = '2015-01-05T09:00/10:00'
        subject.review_slot = '1'
        subject.currently_filling = '1'
      end

      it_behaves_like :options_are_not_available
      it_behaves_like :next_to_fill_is, 1
    end
  end
end
