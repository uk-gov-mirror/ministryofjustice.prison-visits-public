class VisitsController < ApplicationController
  def show
    @visit = PrisonVisits::Api.instance.
             get_visit(params[:id], allow_not_found: true)

    if @visit
      render @visit.processing_state.to_s
    else
      render 'errors/404'
    end
  end
end
